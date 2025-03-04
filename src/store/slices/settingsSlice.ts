import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import storageService from '../../services/storageService';
import { logError } from '../../utils/errorUtils';

/**
 * Interface for wallpaper filter settings
 */
export interface WallpaperFilters {
  categories: string[];
  purity: string[];
  nsfwMode?: 'off' | 'allowed' | 'only'; // Enhanced NSFW filter mode for browsing
  sorting: string;
  order: 'asc' | 'desc';
  query?: string;
  nsfw?: boolean; // Legacy field, kept for backward compatibility
  minWidth?: number;
  minHeight?: number;
  resolution?: string;
}

/**
 * Interface for wallpaper overlay settings
 */
export interface WallpaperOverlay {
  blurAmount: number; // 0-10 scale
  darknessAmount: number; // 0-100 scale
}

/**
 * Interface for the settings state
 */
export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  refreshInterval: number; // in minutes
  wallpaperFilters: WallpaperFilters;
  wallpaperOverlay: WallpaperOverlay;
  isLoading: boolean;
  error: string | null;
  wallpaperSource: 'library' | 'browse';
  changeWallpaperOnNewTab: boolean;
  blurAmount: number;
  saveBlurSettings: boolean;
  refreshSource: 'library' | 'browse'; // Source for refresh operations
  refreshNsfwFilter: 'off' | 'allowed' | 'only'; // NSFW content filter specifically for refresh operations
  browseNsfwFilter: 'off' | 'allowed' | 'only'; // NSFW content filter specifically for browsing
  autoRotateHorizontal: boolean; // Auto-rotate horizontal wallpapers
}

/**
 * Initial state for the settings
 */
const initialState: SettingsState = {
  theme: 'system',
  refreshInterval: 30, // 30 minutes default
  wallpaperFilters: {
    categories: ['general', 'anime'],
    purity: ['sfw'],
    sorting: 'random',
    order: 'desc',
    nsfw: false,
    nsfwMode: 'off' // Default to off
  },
  wallpaperOverlay: {
    blurAmount: 0,
    darknessAmount: 40
  },
  isLoading: false,
  error: null,
  wallpaperSource: 'library',
  changeWallpaperOnNewTab: false,
  blurAmount: 0,
  saveBlurSettings: true,
  refreshSource: 'library',
  refreshNsfwFilter: 'off', // Default to off for refresh operations
  browseNsfwFilter: 'off', // Default to off for browsing
  autoRotateHorizontal: true // Enabled by default
};

/**
 * Load settings from storage
 */
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Loading settings from storage...');
      const settings = await storageService.getSettings();
      console.log('Settings loaded successfully:', settings);
      
      // If no settings are found, return the initial state
      if (!settings) {
        console.log('No settings found, using defaults');
        return initialState;
      }
      
      // Ensure all required properties exist by merging with initialState
      const mergedSettings = { ...initialState, ...settings };
      console.log('Using settings with defaults applied:', mergedSettings);
      
      return mergedSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return rejectWithValue('Failed to load settings');
    }
  }
);

/**
 * Save settings to storage
 */
export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Partial<SettingsState>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      
      // Make sure wallpaperOverlay is properly merged
      const wallpaperOverlay = settings.wallpaperOverlay 
        ? { ...state.settings.wallpaperOverlay, ...settings.wallpaperOverlay }
        : state.settings.wallpaperOverlay;
      
      const updatedSettings = {
        ...state.settings,
        ...settings,
        wallpaperOverlay,
      };
      
      console.log('Saving settings to storage:', updatedSettings);
      
      // Ensure we wait for the storage operation to complete
      await storageService.saveSettings(updatedSettings);
      console.log('Settings saved successfully');
      
      return updatedSettings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return rejectWithValue('Failed to save settings');
    }
  }
);

/**
 * Settings slice
 */
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Set theme
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    // Set refresh interval
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },
    
    // Set wallpaper filters
    setWallpaperFilters: (state, action: PayloadAction<Partial<WallpaperFilters>>) => {
      state.wallpaperFilters = { ...state.wallpaperFilters, ...action.payload };
    },
    
    // Set wallpaper overlay
    setWallpaperOverlay: (state, action: PayloadAction<Partial<WallpaperOverlay>>) => {
      // Create a clean copy of the overlay data with numeric conversion for blur
      const cleanOverlay: Partial<WallpaperOverlay> = {...action.payload};
      
      // If blurAmount is included, ensure it's a proper number
      if (cleanOverlay.blurAmount !== undefined) {
        cleanOverlay.blurAmount = Number(cleanOverlay.blurAmount);
      }
      
      // Update state with clean values
      state.wallpaperOverlay = { ...state.wallpaperOverlay, ...cleanOverlay };
      
      // Sync blurAmount with wallpaperOverlay.blurAmount if it's changing
      if (cleanOverlay.blurAmount !== undefined) {
        const blurValue = cleanOverlay.blurAmount;
        state.blurAmount = blurValue;
        console.log(`Syncing blur amount from overlay to main state: ${blurValue} (${typeof blurValue})`);
      }
      
      // Create a separate function to handle the saving to avoid race conditions
      const saveOverlaySettings = async () => {
        try {
          console.log('Saving overlay settings to storage:', state.wallpaperOverlay);
          const currentSettings = await storageService.getSettings();
          const updatedSettings = {
            ...currentSettings,
            wallpaperOverlay: state.wallpaperOverlay,
            blurAmount: state.blurAmount
          };
          await storageService.saveSettings(updatedSettings);
          console.log('Overlay settings saved successfully');
        } catch (error) {
          console.error('Failed to save overlay settings:', error);
        }
      };
      
      // Always immediately save overlay settings to ensure persistence
      if (state.saveBlurSettings) {
        console.log('Immediately saving wallpaper overlay settings:', state.wallpaperOverlay);
        saveOverlaySettings();
      }
    },
    
    // Reset settings to defaults
    resetSettings: (state) => {
      return { ...initialState, isLoading: state.isLoading, error: state.error };
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setWallpaperSource: (state, action: PayloadAction<'library' | 'browse'>) => {
      state.wallpaperSource = action.payload;
    },
    
    setChangeWallpaperOnNewTab: (state, action: PayloadAction<boolean>) => {
      state.changeWallpaperOnNewTab = action.payload;
    },
    
    setBlurAmount: (state, action: PayloadAction<number>) => {
      // Ensure value is a valid number, forcing conversion to number using Number()
      const blurValue = Number(action.payload);
      console.log(`Received blur amount: ${action.payload} (${typeof action.payload}), converted to: ${blurValue} (${typeof blurValue})`);
      
      // Explicitly set both blur amount fields to ensure consistency
      state.blurAmount = blurValue;
      state.wallpaperOverlay.blurAmount = blurValue;
      
      // Always save blur settings immediately if enabled
      if (state.saveBlurSettings) {
        try {
          console.log('Immediately saving blur settings:', blurValue);
          // Create a complete settings object to ensure all values are saved
          const settingsToSave = {
            ...state,
            blurAmount: blurValue,
            wallpaperOverlay: {
              ...state.wallpaperOverlay,
              blurAmount: blurValue
            }
          };
          
          // Convert to JSON and back to ensure we're not passing any non-serializable values
          const cleanSettings = JSON.parse(JSON.stringify(settingsToSave));
          console.log('Clean settings to save:', cleanSettings.blurAmount, cleanSettings.wallpaperOverlay.blurAmount);
          
          // Use the async/await pattern to catch errors in the promise directly
          (async () => {
            try {
              await storageService.saveSettings(cleanSettings);
              console.log('Blur settings saved successfully');
            } catch (error) {
              console.error('Failed to save blur settings:', error);
            }
          })();
        } catch (error) {
          console.error('Error preparing blur settings for save:', error);
        }
      }
    },
    
    setSaveBlurSettings: (state, action: PayloadAction<boolean>) => {
      state.saveBlurSettings = action.payload;
      
      // Immediately save this setting to ensure it persists
      storageService.saveSettings({
        ...state,
        saveBlurSettings: action.payload
      }).catch(error => {
        console.error('Failed to save blur settings preference:', error);
      });
    },
    
    setRefreshSource: (state, action: PayloadAction<'library' | 'browse'>) => {
      state.refreshSource = action.payload;
    },
    
    setRefreshNsfwFilter: (state, action: PayloadAction<'off' | 'allowed' | 'only'>) => {
      state.refreshNsfwFilter = action.payload;
    },
    
    setBrowseNsfwFilter: (state, action: PayloadAction<'off' | 'allowed' | 'only'>) => {
      state.browseNsfwFilter = action.payload;
    },
    
    setAutoRotateHorizontal: (state, action: PayloadAction<boolean>) => {
      state.autoRotateHorizontal = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Handle loadSettings
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        // Ensure wallpaperOverlay is properly initialized
        const settings = action.payload || initialState;
        
        // Log received settings for debugging
        console.log('Raw received settings:', JSON.stringify({
          blurAmount: settings.blurAmount,
          wallpaperOverlay: settings.wallpaperOverlay
        }));
        
        // Make sure blurAmount values are consistent, prioritizing the explicit blurAmount field
        const blurAmount = typeof settings.blurAmount === 'number' ? settings.blurAmount : 
                           (settings.wallpaperOverlay?.blurAmount || initialState.wallpaperOverlay.blurAmount);
        
        console.log(`Resolved blur amount: ${blurAmount}, type: ${typeof blurAmount}`);
        
        return {
          ...state,
          ...settings,
          // Ensure explicit blurAmount field is set
          blurAmount: blurAmount,
          wallpaperOverlay: {
            ...initialState.wallpaperOverlay,
            ...(settings.wallpaperOverlay || {}),
            // Ensure wallpaperOverlay.blurAmount matches the main blurAmount
            blurAmount: blurAmount
          },
          isLoading: false,
          error: null
        };
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Handle saveSettings
    builder
      .addCase(saveSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        return {
          ...state,
          ...action.payload,
          error: null
        };
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

export const { 
  setTheme, 
  setRefreshInterval, 
  setWallpaperFilters,
  setWallpaperOverlay,
  resetSettings,
  setLoading,
  setError,
  setWallpaperSource,
  setChangeWallpaperOnNewTab,
  setBlurAmount,
  setSaveBlurSettings,
  setRefreshSource,
  setRefreshNsfwFilter,
  setBrowseNsfwFilter,
  setAutoRotateHorizontal
} = settingsSlice.actions;

export default settingsSlice.reducer; 