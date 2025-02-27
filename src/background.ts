/**
 * Background script for the NyaTab extension
 * Runs as a service worker in Manifest V3
 */

import storageService from './services/storageService';
import wallpaperService from './services/wallpaperService';
import { logError } from './utils/errorUtils';
import { Theme } from './utils/theme';

// Initialize the extension
const initialize = async (): Promise<void> => {
  try {
    console.log('Initializing NyaTab extension...');
    
    // Load settings
    const settings = await storageService.getSettings();
    
    // If no settings exist, set up default settings
    if (!settings) {
      console.log('No settings found, setting up defaults...');
      const defaultSettings = {
        theme: 'system' as Theme,
        refreshInterval: 30,
        wallpaperFilters: {
          categories: ['general', 'anime'],
          purity: ['sfw'],
          sorting: 'random',
          order: 'desc' as 'asc' | 'desc'
        }
      };
      
      await storageService.saveSettings(defaultSettings);
    }
    
    // Check if we have a current wallpaper
    const currentWallpaper = await storageService.getCurrentWallpaper();
    
    // If no current wallpaper, fetch one
    if (!currentWallpaper) {
      console.log('No current wallpaper found, fetching one...');
      await wallpaperService.fetchRandomWallpaper();
    }
    
    console.log('NyaTab extension initialized successfully');
  } catch (error) {
    logError('Failed to initialize extension', error);
  }
};

// Set up alarm for wallpaper refresh
const setupWallpaperRefreshAlarm = async (): Promise<void> => {
  try {
    // Get settings to determine refresh interval
    const settings = await storageService.getSettings();
    
    if (!settings) {
      return;
    }
    
    // Clear any existing alarms
    await chrome.alarms.clear('wallpaperRefresh');
    
    // If refresh interval is set and greater than 0, create an alarm
    if (settings.refreshInterval > 0) {
      chrome.alarms.create('wallpaperRefresh', {
        periodInMinutes: settings.refreshInterval
      });
      
      console.log(`Wallpaper refresh alarm set for every ${settings.refreshInterval} minutes`);
    }
  } catch (error) {
    logError('Failed to set up wallpaper refresh alarm', error);
  }
};

// Handle alarm events
// @ts-ignore: Chrome types issue
chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
  if (alarm.name === 'wallpaperRefresh') {
    try {
      console.log('Refreshing wallpaper...');
      await wallpaperService.fetchRandomWallpaper();
    } catch (error) {
      logError('Failed to refresh wallpaper', error);
    }
  }
});

// Handle installation and update events
// @ts-ignore: Chrome types issue
chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    await initialize();
  } else if (details.reason === 'update') {
    console.log(`Extension updated from ${details.previousVersion}`);
    // Perform any necessary migration or update tasks here
  }
  
  // Set up the wallpaper refresh alarm
  await setupWallpaperRefreshAlarm();
});

// Handle messages from content scripts or popup
// @ts-ignore: Chrome types issue
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  // Handle different message types
  if (message.type === 'REFRESH_WALLPAPER') {
    wallpaperService.fetchRandomWallpaper()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        logError('Failed to refresh wallpaper', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  if (message.type === 'UPDATE_SETTINGS') {
    storageService.saveSettings(message.settings)
      .then(() => {
        // If refresh interval changed, update the alarm
        setupWallpaperRefreshAlarm();
        sendResponse({ success: true });
      })
      .catch((error) => {
        logError('Failed to update settings', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  // Return false for unhandled messages
  return false;
});

// Initialize the extension when the service worker starts
initialize(); 