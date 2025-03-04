import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  setTheme, 
  setRefreshInterval, 
  setWallpaperFilters,
  setWallpaperOverlay,
  saveSettings,
  setRefreshNsfwFilter,
  setBrowseNsfwFilter,
  setBlurAmount,
  setSaveBlurSettings,
  setChangeWallpaperOnNewTab
} from '../store/slices/settingsSlice';
import storageService from '../services/storageService';
import { getMessage } from '../utils/i18n';
import { Theme, applyTheme, detectSystemTheme } from '../utils/theme';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { AppDispatch } from '../store';
import { setShuffleEnabled, setShuffleInterval, setShuffleOnNewTab, shuffleWallpaper } from '../store/slices/wallpaperSlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// Add a utility function to send messages to the background script
const sendMessageToBackground = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
};

interface SettingsProps {
  onClose: () => void;
}

/**
 * Component for displaying and managing settings
 */
const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { isShuffleEnabled, shuffleInterval, shuffleOnNewTab, library } = useSelector((state: RootState) => state.wallpaper);
  const { refreshSource, refreshNsfwFilter } = useSelector((state: RootState) => state.settings);
  const [lastShuffleTime, setLastShuffleTime] = useState<Date | null>(null);
  const [nextShuffleTime, setNextShuffleTime] = useState<Date | null>(null);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Effect to load last shuffle time from storage
  useEffect(() => {
    const loadLastShuffleTime = async () => {
      try {
        // Use chrome.storage.local API directly for lastShuffleTime
        const data = await new Promise<{[key: string]: any}>((resolve) => {
          chrome.storage.local.get(['lastShuffleTime'], resolve);
        });
        
        if (data.lastShuffleTime) {
          setLastShuffleTime(new Date(data.lastShuffleTime));
          
          // Calculate next shuffle time if auto-shuffle is enabled
          if (isShuffleEnabled && shuffleInterval > 0) {
            const nextTime = new Date(data.lastShuffleTime);
            nextTime.setMinutes(nextTime.getMinutes() + shuffleInterval);
            setNextShuffleTime(nextTime);
          } else {
            setNextShuffleTime(null);
          }
        }
      } catch (error) {
        console.error('Failed to load last shuffle time:', error);
      }
    };
    
    loadLastShuffleTime();
  }, [isShuffleEnabled, shuffleInterval]);

  // Save settings to storage whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        setIsSaving(true);
        await storageService.saveSettings(settings);
        setSaveMessage(getMessage('settingsSaved'));
        
        // Clear the save message after 3 seconds
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } catch (err) {
        console.error('Error saving settings:', err);
        setSaveMessage(getMessage('settingsSaveError'));
      } finally {
        setIsSaving(false);
      }
    };

    saveSettings();
  }, [settings]);

  // Save shuffle settings to storage when they change
  useEffect(() => {
    // Only save if isShuffleEnabled or shuffleInterval has changed
    if (isShuffleEnabled !== undefined && shuffleInterval !== undefined) {
      console.log('Saving shuffle settings to storage:', { isShuffleEnabled, shuffleInterval });
      
      // Save to chrome.storage.local directly
      chrome.storage.local.set({
        isShuffleEnabled,
        shuffleInterval
      }).then(() => {
        console.log('Shuffle settings saved successfully');
      }).catch(error => {
        console.error('Failed to save shuffle settings:', error);
      });
    }
  }, [isShuffleEnabled, shuffleInterval]);

  // Handle theme change
  const handleThemeChange = (theme: Theme) => {
    dispatch(setTheme(theme));
  };

  // Handle refresh interval change
  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    dispatch(setRefreshInterval(value));
  };

  // Handle wallpaper filter change
  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = [...settings.wallpaperFilters.categories];
    
    if (checked && !currentCategories.includes(category)) {
      dispatch(setWallpaperFilters({
        categories: [...currentCategories, category]
      }));
    } else if (!checked && currentCategories.includes(category)) {
      dispatch(setWallpaperFilters({
        categories: currentCategories.filter(c => c !== category)
      }));
    }
  };

  // Handle blur amount change
  const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    console.log(`Setting blur amount in UI: ${value} (parsed from ${e.target.value})`);
    dispatch(setWallpaperOverlay({
      blurAmount: value
    }));
  };

  // Handle darkness amount change
  const handleDarknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    dispatch(setWallpaperOverlay({
      darknessAmount: value
    }));
  };

  // Handle purity filter change
  const handlePurityChange = (purity: string, checked: boolean) => {
    const currentPurity = [...settings.wallpaperFilters.purity];
    
    if (checked && !currentPurity.includes(purity)) {
      dispatch(setWallpaperFilters({
        purity: [...currentPurity, purity]
      }));
    } else if (!checked && currentPurity.includes(purity)) {
      dispatch(setWallpaperFilters({
        purity: currentPurity.filter(p => p !== purity)
      }));
    }
  };

  // Handle sorting change
  const handleSortingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setWallpaperFilters({
      sorting: e.target.value
    }));
  };

  // Handle order change
  const handleOrderChange = (order: 'asc' | 'desc') => {
    dispatch(setWallpaperFilters({
      order
    }));
  };

  const handleShuffleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    dispatch(setShuffleEnabled(enabled));
    
    // If shuffle is disabled, also disable shuffle on new tab
    if (!enabled && shuffleOnNewTab) {
      dispatch(setShuffleOnNewTab(false));
    }
    
    // Update next shuffle time
    if (enabled && shuffleInterval > 0) {
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + shuffleInterval);
      setNextShuffleTime(nextTime);
      
      // Notify background script to start the shuffle alarm
      sendMessageToBackground({
        type: 'SHUFFLE_SETTINGS_UPDATED',
        isEnabled: enabled,
        interval: shuffleInterval
      }).then(response => {
        console.log('Background script response:', response);
      }).catch(error => {
        console.error('Failed to update background script:', error);
      });
    } else {
      setNextShuffleTime(null);
      
      // Notify background script to stop the shuffle alarm
      sendMessageToBackground({
        type: 'SHUFFLE_SETTINGS_UPDATED',
        isEnabled: false,
        interval: 0
      }).catch(error => {
        console.error('Failed to update background script:', error);
      });
    }
    
    // Show feedback to user
    setSaveMessage(enabled ? 'Auto-shuffle enabled!' : 'Auto-shuffle disabled');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Add a function to check library status and prevent settings that would cause errors
  const validateShuffleSettings = () => {
    // Check if library is empty but refresh source is set to library
    if (settings.refreshSource === 'library' && library.length === 0) {
      setSaveMessage('Warning: Your library is empty. Please add wallpapers or change refresh source to "Browse".');
      setTimeout(() => setSaveMessage(''), 5000);
      return false;
    }
    return true;
  };

  // Add this check to the handleIntervalChange function
  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseFloat(event.target.value);
    
    // Validate settings before enabling shuffle
    if (value > 0 && settings.refreshSource === 'library' && library.length === 0) {
      // Show warning but don't enable shuffle
      setSaveMessage('Cannot enable auto-shuffle: Your library is empty. Please add wallpapers first or change refresh source to "Browse".');
      setTimeout(() => setSaveMessage(''), 5000);
      return; // Exit early without saving these settings
    }
    
    if (value === 0) {
      // If "On new tab open" is selected
      dispatch(setShuffleEnabled(true));
      dispatch(setShuffleInterval(0));
      dispatch(setShuffleOnNewTab(true));
      
      // Make sure the changeWallpaperOnNewTab setting is enabled in settings
      const updatedSettings = {
        ...settings,
        changeWallpaperOnNewTab: true
      };
      dispatch(saveSettings(updatedSettings));
      
      setNextShuffleTime(null); // No scheduled next time for on-demand shuffling
      
      // Notify background script to stop the interval-based alarm but enable new tab change
      sendMessageToBackground({
        type: 'SHUFFLE_SETTINGS_UPDATED',
        isEnabled: false, // Disable interval-based shuffle
        interval: 0,
        newTabEnabled: true // But enable on new tab
      }).catch(error => {
        console.error('Failed to update background script:', error);
      });
      
      // Show feedback to user about mode change
      setSaveMessage('Wallpaper will change on each new tab open');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      // For timed intervals
      dispatch(setShuffleEnabled(true));
      dispatch(setShuffleInterval(value));
      dispatch(setShuffleOnNewTab(false)); 
      
      // Make sure the changeWallpaperOnNewTab setting is disabled in settings
      const updatedSettings = {
        ...settings,
        changeWallpaperOnNewTab: false
      };
      dispatch(saveSettings(updatedSettings));
      
      // Calculate and show next shuffle time
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + value);
      setNextShuffleTime(nextTime);
      
      // Notify background script to update the shuffle alarm
      sendMessageToBackground({
        type: 'SHUFFLE_SETTINGS_UPDATED',
        isEnabled: true,
        interval: value,
        newTabEnabled: false
      }).then(response => {
        console.log('Background script updated shuffle interval:', response);
      }).catch(error => {
        console.error('Failed to update background script:', error);
      });
      
      // Show feedback with appropriate time unit
      let timeDisplay = '';
      if (value < 1) {
        timeDisplay = `${Math.round(value * 60)} seconds`;
      } else if (value === 60) {
        timeDisplay = '1 hour';
      } else if (value > 60) {
        timeDisplay = `${value / 60} hours`;
      } else {
        timeDisplay = `${value} minutes`;
      }
      
      setSaveMessage(`Wallpaper will change every ${timeDisplay}`);
      setTimeout(() => setSaveMessage(''), 3000);
    }

    console.log(`Shuffle interval changed to ${value}, shuffleOnNewTab: ${value === 0}`);
  };

  const handleShuffleOnNewTabToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    
    console.log(`Toggling change wallpaper on new tab: ${enabled}`);
    
    // Update Redux state
    dispatch(setShuffleOnNewTab(enabled));
    
    // If enabling shuffle on new tab, make sure shuffle is enabled
    if (enabled && !isShuffleEnabled) {
      dispatch(setShuffleEnabled(true));
    }
    
    // If enabling shuffle on new tab, set interval to 0 (special value)
    if (enabled) {
      dispatch(setShuffleInterval(0));
      
      // Update the settings to ensure changeWallpaperOnNewTab is also enabled
      const updatedSettings = {
        ...settings,
        changeWallpaperOnNewTab: true
      };
      dispatch(saveSettings(updatedSettings));
      
      // Save to local storage directly as well to ensure it's available to the background script
      chrome.storage.local.set({
        isShuffleEnabled: true,
        shuffleInterval: 0,
        shuffleOnNewTab: true,
        settings: updatedSettings
      }).then(() => {
        console.log('Saved new tab shuffle settings to storage');
      }).catch(error => {
        console.error('Failed to save new tab shuffle settings to storage:', error);
      });
      
      // Also notify the background script
      sendMessageToBackground({
        type: 'SHUFFLE_SETTINGS_UPDATED',
        isEnabled: true,
        interval: 0,
        newTabEnabled: true
      }).catch(error => {
        console.error('Failed to update background script:', error);
      });
      
      console.log('Enabled change wallpaper on new tab');
      setSaveMessage('Wallpaper will change on each new tab open');
      setTimeout(() => setSaveMessage(''), 3000);
    } else if (shuffleInterval === 0) {
      // If disabling and current interval is 0, set to 30 minutes
      dispatch(setShuffleInterval(30));
      
      // Update the settings to ensure changeWallpaperOnNewTab is also disabled
      const updatedSettings = {
        ...settings,
        changeWallpaperOnNewTab: false
      };
      dispatch(saveSettings(updatedSettings));
      
      // Save to local storage directly as well
      chrome.storage.local.set({
        shuffleOnNewTab: false,
        shuffleInterval: 30,
        settings: updatedSettings
      }).then(() => {
        console.log('Saved updated shuffle settings to storage (disabled new tab shuffle)');
      }).catch(error => {
        console.error('Failed to save updated shuffle settings to storage:', error);
      });
      
      // Also notify the background script
      sendMessageToBackground({
        type: 'SHUFFLE_SETTINGS_UPDATED',
        isEnabled: isShuffleEnabled,
        interval: 30,
        newTabEnabled: false
      }).catch(error => {
        console.error('Failed to update background script:', error);
      });
      
      console.log('Disabled change wallpaper on new tab');
      setSaveMessage('Wallpaper will no longer change on new tab open');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Update the handleManualShuffle function to check library status
  const handleManualShuffle = async () => {
    try {
      // Check if library is empty but refresh source is set to library
      if (settings.refreshSource === 'library' && library.length === 0) {
        setSaveMessage('Cannot shuffle: Your library is empty. Please add wallpapers or change refresh source to "Browse".');
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }
      
      // Only show status in the settings panel, not as a global notification
      setSaveMessage('Shuffling wallpaper...');
      
      // Send message to background script to perform the shuffle
      const response = await sendMessageToBackground({
        type: 'SHUFFLE_WALLPAPER',
        source: refreshSource,
        nsfwFilter: refreshNsfwFilter,
        silent: true // Add parameter to indicate notifications should be silent
      });
      
      if (response && response.success) {
        // Update last shuffle time
        const now = new Date();
        setLastShuffleTime(now);
        
        // Update next shuffle time if auto-shuffle is enabled
        if (isShuffleEnabled && shuffleInterval > 0) {
          const nextTime = new Date();
          nextTime.setMinutes(nextTime.getMinutes() + shuffleInterval);
          setNextShuffleTime(nextTime);
        }
        
        // Only show status in the settings panel
        setSaveMessage('Wallpaper shuffled successfully!');
      } else {
        setSaveMessage('Failed to shuffle wallpaper. Please try again.');
      }
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to shuffle wallpaper:', error);
      setSaveMessage('Failed to shuffle wallpaper. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Update the handleSettingChange function to check for incompatible settings
  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings };
    
    // Handle the refresh source change
    if (key === 'refreshSource') {
      // If switching to library but library is empty, warn the user
      if (value === 'library' && library.length === 0) {
        setSaveMessage('Warning: Your library is empty. Auto-shuffle may not work until you add wallpapers.');
        setTimeout(() => setSaveMessage(''), 5000);
      }
      
      newSettings.refreshSource = value;
      dispatch(saveSettings(newSettings));
    } 
    // Handle the NSFW filter and other settings
    else if (key === 'refreshNsfwFilter') {
      newSettings.refreshNsfwFilter = value;
      dispatch(setRefreshNsfwFilter(value));
      dispatch(saveSettings(newSettings));
    } 
    // Handle other settings as before
    else {
      // ... existing code ...
    }
    
    dispatch(saveSettings(newSettings))
      .unwrap()
      .then(() => {
        // Show success notification
      })
      .catch((error: Error) => {
        // Show error notification
        console.error('Failed to save settings:', error);
      });
  };

  // Handle manually saving all settings
  const handleSaveAllSettings = async () => {
    try {
      setIsSaving(true);
      // Create a clean copy of settings to save
      const settingsToSave = JSON.parse(JSON.stringify(settings));
      
      await storageService.saveSettings(settingsToSave);
      setSaveMessage('All settings saved successfully!');
      
      // Clear the save message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving all settings:', err);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-black/80 backdrop-blur-sm text-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Wallpaper Settings</h3>
            
            <div className="flex items-center justify-between">
              <label htmlFor="shuffle-toggle" className="flex items-center cursor-pointer">
                <span className="mr-3">Auto-shuffle wallpapers</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="shuffle-toggle"
                    className="sr-only"
                    checked={isShuffleEnabled}
                    onChange={handleShuffleToggle}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${
                    isShuffleEnabled ? 'bg-pink-600' : 'bg-gray-600'
                  }`} />
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                    isShuffleEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>

            {isShuffleEnabled && (
              <div className="space-y-4 pl-4 mt-2 border-l-2 border-pink-600/30">
                <div className="flex items-center justify-between">
                  <label htmlFor="shuffle-interval" className="text-sm">
                    Change wallpaper every:
                  </label>
                  <select
                    id="shuffle-interval"
                    value={shuffleInterval.toString()}
                    onChange={handleIntervalChange}
                    className="ml-4 px-3 py-1 bg-white/10 rounded-md border border-white/20 focus:outline-none focus:border-pink-500"
                  >
                    <option value="0">On new tab open</option>
                    <option value="0.083">5 seconds</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="180">3 hours</option>
                    <option value="360">6 hours</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>
                
                {/* Shuffle information and stats */}
                <div className="text-xs space-y-1 text-white/80">
                  {lastShuffleTime && (
                    <div>Last changed: {lastShuffleTime.toLocaleString()}</div>
                  )}
                  {nextShuffleTime && (
                    <div>Next change: {nextShuffleTime.toLocaleString()}</div>
                  )}
                </div>
                
                {/* Manual shuffle button */}
                <div className="mt-2">
                  <button 
                    onClick={handleManualShuffle}
                    className="flex items-center justify-center w-full py-2 px-4 bg-pink-600/30 hover:bg-pink-600/50 rounded-md transition-colors"
                    disabled={library.length === 0}
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Shuffle Now
                  </button>
                </div>
                
                {library.length === 0 && (
                  <div className="text-yellow-400 text-xs italic">
                    You need to add wallpapers to your library before shuffle will work. 
                    Visit the Browser to add wallpapers.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <label htmlFor="new-tab-shuffle" className="flex items-center cursor-pointer">
                <span className="mr-3">Change wallpaper on new tab</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="new-tab-shuffle"
                    className="sr-only"
                    checked={shuffleOnNewTab}
                    onChange={handleShuffleOnNewTabToggle}
                    disabled={!isShuffleEnabled}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${
                    shuffleOnNewTab ? 'bg-pink-600' : isShuffleEnabled ? 'bg-gray-600' : 'bg-gray-800'
                  } ${!isShuffleEnabled ? 'opacity-50' : ''}`} />
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                    shuffleOnNewTab ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <h4 className="text-md font-medium mb-3">Wallpaper Appearance</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="blur-slider" className="text-sm">
                      Background Blur: {settings.wallpaperOverlay.blurAmount}px
                    </label>
                    <span className="text-xs text-white/70">
                      {settings.wallpaperOverlay.blurAmount === 0 ? 'None' : 
                       settings.wallpaperOverlay.blurAmount < 3 ? 'Light' : 
                       settings.wallpaperOverlay.blurAmount < 7 ? 'Medium' : 'Heavy'}
                    </span>
                  </div>
                  <input
                    id="blur-slider"
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={settings.wallpaperOverlay.blurAmount}
                    onChange={handleBlurChange}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="darkness-slider" className="text-sm">
                      Darkness Overlay: {settings.wallpaperOverlay.darknessAmount}%
                    </label>
                    <span className="text-xs text-white/70">
                      {settings.wallpaperOverlay.darknessAmount < 20 ? 'Light' : 
                       settings.wallpaperOverlay.darknessAmount < 50 ? 'Medium' : 
                       settings.wallpaperOverlay.darknessAmount < 80 ? 'Dark' : 'Very Dark'}
                    </span>
                  </div>
                  <input
                    id="darkness-slider"
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={settings.wallpaperOverlay.darknessAmount}
                    onChange={handleDarknessChange}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              </div>
            </div>

            <div className="setting-group">
              <h3 className="text-lg font-medium text-white mb-2">Wallpaper Refresh Options</h3>
              
              <div className="setting-item">
                <label htmlFor="refreshSource" className="text-white">Refresh Source:</label>
                <select
                  id="refreshSource"
                  className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-md"
                  value={settings.refreshSource}
                  onChange={(e) => handleSettingChange('refreshSource', e.target.value)}
                >
                  <option value="library">Library Only</option>
                  <option value="browse">Browse (Wallhaven)</option>
                </select>
                <p className="text-sm text-white/60">Choose where to fetch wallpapers when refreshing</p>
              </div>
            </div>
          </div>
        </div>

        {saveMessage && (
          <div className="mt-2 text-center text-sm">
            <span className={saveMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}>
              {saveMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 