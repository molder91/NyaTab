/// <reference types="chrome"/>

/**
 * Background script for the NyaTab extension
 * Runs as a service worker in Manifest V3
 */

import { SettingsState, loadSettings } from './store/slices/settingsSlice';
import storageService from './services/storageService';
import wallpaperService from './services/wallpaperService';
import { logError } from './utils/errorUtils';
import { Theme } from './utils/theme';
import store from './store';
import { shuffleWallpaper } from './store/slices/wallpaperSlice';
import { getRandomInt } from './utils/mathUtils';
import type { Wallpaper } from './types/wallpaper';

// Chrome API types
declare global {
  namespace chrome {
    export interface Alarm {
      name: string;
      scheduledTime: number;
      periodInMinutes?: number;
    }

    export interface Tab {
      id?: number;
      url?: string;
    }

    export interface MessageSender {
      tab?: Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    export interface Runtime {
      onInstalled: {
        addListener(callback: (details: { reason: string; previousVersion?: string; id?: string }) => void): void;
        removeListener(callback: (details: { reason: string; previousVersion?: string; id?: string }) => void): void;
      };
      onMessage: {
        addListener(
          callback: (
            message: any,
            sender: MessageSender,
            sendResponse: (response?: any) => void
          ) => boolean | void | Promise<void>
        ): void;
        removeListener(
          callback: (
            message: any,
            sender: MessageSender,
            sendResponse: (response?: any) => void
          ) => void
        ): void;
      };
    }
  }
}

interface MessageResponse {
  success: boolean;
  error?: string;
}

interface SettingsUpdatedMessage {
  type: 'SETTINGS_UPDATED';
  settings: SettingsState;
}

interface ShuffleWallpaperMessage {
  type: 'SHUFFLE_WALLPAPER';
}

// Add a new message type for shuffle settings changes
interface ShuffleSettingsMessage {
  type: 'SHUFFLE_SETTINGS_UPDATED';
  isEnabled: boolean;
  interval: number;
  newTabEnabled?: boolean;
}

type ExtensionMessage = SettingsUpdatedMessage | ShuffleWallpaperMessage | ShuffleSettingsMessage;

console.log('Background script loaded');

// Function to set up the shuffle alarm based on settings
const setupShuffleAlarm = async (enabled: boolean, intervalMinutes: number, newTabEnabled?: boolean) => {
  console.log(`Setting up shuffle alarm: enabled=${enabled}, interval=${intervalMinutes} minutes, newTabEnabled=${newTabEnabled}`);
  
  // Clear any existing shuffle alarm
  await chrome.alarms.clear('shuffleWallpaper');
  
  // Store the newTabEnabled preference and other shuffle settings
  try {
    // Load existing settings
    const settingsData = await chrome.storage.local.get(['settings', 'isShuffleEnabled', 'shuffleInterval', 'shuffleOnNewTab']);
    const settings = settingsData.settings || {};
    
    // Update all the shuffle-related settings
    if (newTabEnabled !== undefined) {
      settings.changeWallpaperOnNewTab = newTabEnabled;
      
      // Also store the standalone setting
      await chrome.storage.local.set({ shuffleOnNewTab: newTabEnabled });
      console.log(`Updated shuffleOnNewTab setting to: ${newTabEnabled}`);
    }
    
    // Always update isShuffleEnabled status
    await chrome.storage.local.set({ 
      isShuffleEnabled: enabled,
      shuffleInterval: intervalMinutes
    });
    
    // Save all updated settings
    await chrome.storage.local.set({ settings });
    
    console.log('Updated shuffle settings in storage:', {
      isShuffleEnabled: enabled,
      shuffleInterval: intervalMinutes,
      changeWallpaperOnNewTab: settings.changeWallpaperOnNewTab,
      shuffleOnNewTab: newTabEnabled
    });
  } catch (error) {
    console.error('Failed to save shuffle settings:', error);
  }
  
  // If enabled and interval is valid, create a new alarm
  if (enabled && intervalMinutes > 0) {
    console.log(`Creating shuffle alarm to run every ${intervalMinutes} minutes`);
    chrome.alarms.create('shuffleWallpaper', {
      periodInMinutes: intervalMinutes
    });
    
    // Record the time the alarm was created
    const now = new Date();
    chrome.storage.local.set({
      shuffleAlarmCreated: now.toISOString(),
      shuffleIntervalMinutes: intervalMinutes
    });
    
    console.log(`Shuffle alarm scheduled, next run at: ${new Date(now.getTime() + intervalMinutes * 60000).toLocaleString()}`);
    return true;
  } else {
    console.log('Shuffle alarm disabled or interval is 0 (using on-demand or new tab shuffle)');
    return false;
  }
};

// Function to perform the actual wallpaper shuffle
const performWallpaperShuffle = async () => {
  try {
    console.log('Performing wallpaper shuffle from background');
    
    // Get settings to determine source and filters
    const settingsData = await chrome.storage.local.get('settings');
    const settings = settingsData.settings || {};
    
    // Check if using library source and verify library has wallpapers
    if (settings.refreshSource === 'library') {
      const libraryData = await storageService.getLibrary();
      if (!libraryData || libraryData.length === 0) {
        console.error('Cannot shuffle: Library is empty but refresh source is set to library');
        return {
          success: false,
          error: 'Your wallpaper library is empty. Please add wallpapers to your library or change refresh source to Browse.'
        };
      }
    }
    
    // Update the last shuffle time
    const now = new Date();
    await chrome.storage.local.set({ lastShuffleTime: now.toISOString() });
    
    try {
      // Use the store.dispatch directly with the redux action
      await store.dispatch(shuffleWallpaper({
        source: settings.refreshSource || 'library',
        nsfwFilter: settings.refreshNsfwFilter || 'off',
        silent: true
      })).unwrap();
      
      console.log('Wallpaper shuffled successfully');
      return { success: true };
    } catch (shuffleError: unknown) {
      console.error('Failed to shuffle wallpaper:', shuffleError);
      
      // If library is empty but source is still set to library, try using browse as a fallback
      if (settings.refreshSource === 'library' && 
          shuffleError instanceof Error && 
          shuffleError.message.includes('library is empty')) {
        console.log('Trying fallback to browse source since library is empty');
        
        try {
          await store.dispatch(shuffleWallpaper({
            source: 'browse',
            nsfwFilter: settings.refreshNsfwFilter || 'off',
            silent: true
          })).unwrap();
          
          console.log('Wallpaper shuffled successfully using browse fallback');
          return { success: true };
        } catch (fallbackError) {
          console.error('Fallback to browse source also failed:', fallbackError);
          return { 
            success: false, 
            error: fallbackError instanceof Error ? fallbackError.message : 'Failed to shuffle wallpaper',
            details: fallbackError
          };
        }
      }
      
      return { 
        success: false, 
        error: shuffleError instanceof Error ? shuffleError.message : 'Failed to shuffle wallpaper',
        details: shuffleError
      };
    }
  } catch (error) {
    console.error('Failed to shuffle wallpaper:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to shuffle wallpaper',
      details: error
    };
  }
};

// Initialize the background script
const initBackground = async () => {
  console.log('Initializing background script');
  
  // Load existing shuffle settings on startup
  const data = await chrome.storage.local.get(['settings', 'isShuffleEnabled', 'shuffleInterval']);
  
  // Set up the shuffle alarm based on saved settings
  if (data.settings) {
    console.log('Loaded settings from storage:', data.settings);
    
    // Check for shuffle settings in wallpaper state
    const shuffleEnabled = data.isShuffleEnabled === true;
    const shuffleInterval = parseFloat(data.shuffleInterval || '0');
    
    if (shuffleEnabled && shuffleInterval > 0) {
      console.log(`Initializing shuffle with interval: ${shuffleInterval} minutes`);
      await setupShuffleAlarm(true, shuffleInterval);
    } else {
      console.log('Auto-shuffle not enabled or interval is not set');
    }
  }
  
  // Listen for new tab creation
  chrome.tabs.onCreated.addListener(async (tab) => {
    try {
      console.log('New tab created:', tab.id, tab.pendingUrl || tab.url);
      
      // Enhanced check for new tab pages across different browsers
      // Chrome uses 'chrome://newtab/', Edge uses 'edge://newtab/'
      // Some browsers might use tab.url instead of tab.pendingUrl
      const tabUrl = tab.pendingUrl || tab.url || '';
      const isNewTabPage = tabUrl.includes('://newtab') || 
                          tabUrl === 'about:blank' || 
                          tabUrl === '' || 
                          tabUrl.includes('://new-tab');
      
      if (!isNewTabPage) {
        console.log('Not a new tab page, ignoring. URL:', tabUrl);
        return;
      }
      
      console.log('Confirmed new tab page. Will check if wallpaper shuffle is enabled.');
      
      // Load settings to check if we should change wallpaper
      // Include all possible settings keys to ensure we get complete data
      const settingsData = await chrome.storage.local.get(['settings', 'isShuffleEnabled', 'shuffleInterval', 'shuffleOnNewTab']);
      const settings = settingsData.settings || {};
      const isShuffleEnabled = settingsData.isShuffleEnabled === true;
      const shuffleOnNewTab = settingsData.shuffleOnNewTab === true;
      
      console.log('Loaded settings for new tab check:', { 
        settings: JSON.stringify(settings),
        changeWallpaperOnNewTab: settings.changeWallpaperOnNewTab,
        isShuffleEnabled,
        shuffleInterval: settingsData.shuffleInterval,
        shuffleOnNewTab
      });
      
      // More flexible check for whether wallpaper should change on new tab
      // Will change wallpaper if either:
      // 1. The main settings.changeWallpaperOnNewTab is true
      // 2. OR both shuffle is enabled AND specifically set to change on new tab
      const shouldChangeWallpaper = settings.changeWallpaperOnNewTab === true || 
                                  (isShuffleEnabled === true && shuffleOnNewTab === true);
      
      if (shouldChangeWallpaper) {
        console.log('Change wallpaper on new tab is enabled. Will proceed with shuffle.');
        
        // Use the right refresh source from settings
        const refreshSource = settings.refreshSource || 'library';
        const nsfwFilter = settings.refreshNsfwFilter || 'off';
        
        console.log('Using refresh source:', refreshSource);
        console.log('Using NSFW filter:', nsfwFilter);
        
        // If source is library, verify it has wallpapers
        let useSourceForShuffle = refreshSource;
        
        if (refreshSource === 'library') {
          try {
            const libraryData = await storageService.getLibrary();
            if (!libraryData || libraryData.length === 0) {
              console.warn('Library is empty for new tab shuffle, will try browse source instead');
              useSourceForShuffle = 'browse';
            } else {
              console.log(`Library has ${libraryData.length} wallpapers. Proceeding with shuffle.`);
            }
          } catch (libraryError) {
            console.error('Failed to check library:', libraryError);
            // Fall back to browse source if we can't check the library
            useSourceForShuffle = 'browse';
          }
        }
        
        // Update the wallpaper directly using the store
        try {
          console.log(`Dispatching shuffleWallpaper action from new tab handler using source: ${useSourceForShuffle}`);
          await store.dispatch(shuffleWallpaper({
            source: useSourceForShuffle,
            nsfwFilter: nsfwFilter,
            silent: true
          })).unwrap();
          
          // Update the last shuffle time
          const now = new Date();
          await chrome.storage.local.set({ lastShuffleTime: now.toISOString() });
          
          console.log('Wallpaper changed successfully on new tab');
        } catch (error) {
          console.error('Failed to shuffle wallpaper on new tab:', error);
          
          // If we initially tried library but it failed, try browse as fallback
          if (useSourceForShuffle === 'library' && error instanceof Error && 
              error.message && error.message.includes('library is empty')) {
            
            console.log('First attempt with library source failed, trying browse as fallback');
            
            try {
              await store.dispatch(shuffleWallpaper({
                source: 'browse',
                nsfwFilter: nsfwFilter,
                silent: true
              })).unwrap();
              
              // Update the last shuffle time
              const now = new Date();
              await chrome.storage.local.set({ lastShuffleTime: now.toISOString() });
              
              console.log('Wallpaper changed successfully on new tab using browse fallback');
            } catch (fallbackError) {
              console.error('Browse fallback also failed:', fallbackError);
            }
          }
        }
      } else {
        console.log('Change wallpaper on new tab is disabled. Settings:', {
          changeWallpaperOnNewTab: settings.changeWallpaperOnNewTab,
          isShuffleEnabled,
          shuffleOnNewTab
        });
      }
    } catch (error) {
      console.error('Error in onCreated handler:', error);
    }
  });
};

// Set up alarms for periodic functionality
chrome.alarms.create('clearHistory', {
  periodInMinutes: 60 * 24 // Once a day
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'clearHistory') {
    console.log('Running daily history cleanup');
    // TODO: Implement history cleanup logic if needed
  } else if (alarm.name === 'shuffleWallpaper') {
    console.log('Running scheduled wallpaper shuffle');
    await performWallpaperShuffle();
    
    // Update analytics if needed
    const data = await chrome.storage.local.get(['shuffleCount']);
    const count = (data.shuffleCount || 0) + 1;
    await chrome.storage.local.set({ shuffleCount: count });
    console.log(`Wallpaper has been auto-shuffled ${count} times`);
  }
});

// Initialize the background script
initBackground().catch(error => {
  console.error('Failed to initialize background script:', error);
});

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(async (details: { reason: string; previousVersion?: string; id?: string }) => {
  try {
    if (details.reason === 'install' || details.reason === 'update') {
      console.log(`Extension ${details.reason}ed`);
      await initBackground();
    }
  } catch (error: unknown) {
    logError('Failed to handle installation', error);
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse: (response?: any) => void) => {
  console.log('Received message in background:', message.type);
  
  if (message.type === 'GET_WALLPAPER') {
    wallpaperService.fetchRandomWallpaper()
      .then(wallpaper => sendResponse({ wallpaper }))
      .catch(error => {
        logError('Failed to get wallpaper', error);
        sendResponse({ error: 'Failed to get wallpaper' });
      });
    return true; // Keep the message channel open for async response
  } 
  
  // Handle shuffle settings updates
  else if (message.type === 'SHUFFLE_SETTINGS_UPDATED') {
    console.log('Received shuffle settings update:', message);
    setupShuffleAlarm(message.isEnabled, message.interval, message.newTabEnabled)
      .then(success => {
        sendResponse({ success });
      })
      .catch(error => {
        logError('Failed to update shuffle settings', error);
        sendResponse({ error: 'Failed to update shuffle settings' });
      });
    return true; // Keep the message channel open for async response
  }
  
  // Handle manual shuffle requests
  else if (message.type === 'SHUFFLE_WALLPAPER') {
    console.log('Received manual shuffle request', message);
    
    // Check if library is the source and verify it's not empty
    if (message.source === 'library') {
      storageService.getLibrary()
        .then(libraryData => {
          if (!libraryData || libraryData.length === 0) {
            console.error('Cannot shuffle: Library is empty');
            sendResponse({ 
              success: false, 
              error: 'Your wallpaper library is empty. Please add wallpapers to your library or change refresh source to Browse.'
            });
            return;
          }
          
          // Continue with shuffle if library has items
          const source = message.source || 'library';
          const nsfwFilter = message.nsfwFilter || 'off';
          
          // Update the last shuffle time
          const now = new Date();
          chrome.storage.local.set({ lastShuffleTime: now.toISOString() });
          
          // Dispatch shuffle action directly
          store.dispatch(shuffleWallpaper({
            source,
            nsfwFilter,
            silent: true
          }))
            .unwrap()
            .then(() => {
              console.log('Wallpaper shuffled successfully via message');
              sendResponse({ success: true });
            })
            .catch(error => {
              logError('Failed to shuffle wallpaper in dispatch', error);
              sendResponse({ 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to shuffle wallpaper' 
              });
            });
        })
        .catch(error => {
          logError('Failed to check library', error);
          sendResponse({ 
            success: false, 
            error: 'Failed to check library status'
          });
        });
    } else {
      // If source is not library, just dispatch the shuffle action
      const source = message.source || 'library';
      const nsfwFilter = message.nsfwFilter || 'off';
      
      // Update the last shuffle time
      const now = new Date();
      chrome.storage.local.set({ lastShuffleTime: now.toISOString() });
      
      // Dispatch shuffle action directly
      store.dispatch(shuffleWallpaper({
        source,
        nsfwFilter,
        silent: true
      }))
        .unwrap()
        .then(() => {
          console.log('Wallpaper shuffled successfully via message');
          sendResponse({ success: true });
        })
        .catch(error => {
          logError('Failed to shuffle wallpaper in dispatch', error);
          sendResponse({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to shuffle wallpaper' 
          });
        });
    }
    
    return true; // Keep the message channel open for async response
  }
  
  return false;
}); 