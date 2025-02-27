import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import storageService from '../../services/storageService';
import { logError } from '../../utils/errorUtils';

/**
 * Interface for wallpaper filter settings
 */
export interface WallpaperFilters {
  categories: string[];
  purity: string[];
  sorting: string;
  order: 'asc' | 'desc';
  query?: string; // Optional search query for wallpapers
}

/**
 * Interface for the settings state
 */
export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  refreshInterval: number; // in minutes
  wallpaperFilters: WallpaperFilters;
  isLoading: boolean;
  error: string | null;
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
    order: 'desc'
  },
  isLoading: false,
  error: null
};

/**
 * Async thunk for loading settings from storage
 */
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await storageService.getSettings();
      return settings || initialState;
    } catch (error) {
      logError('Failed to load settings', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load settings');
    }
  }
);

/**
 * Async thunk for saving settings to storage
 */
export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Partial<SettingsState>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedSettings = { ...state.settings, ...settings };
      
      // Remove loading and error states before saving
      const { isLoading, error, ...settingsToSave } = updatedSettings;
      
      await storageService.saveSettings(settingsToSave);
      return settings;
    } catch (error) {
      logError('Failed to save settings', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save settings');
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
        // Merge loaded settings with current state
        return { ...state, ...action.payload, isLoading: false, error: null };
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to load settings';
      });
    
    // Handle saveSettings
    builder
      .addCase(saveSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        // Update state with saved settings
        return { ...state, ...action.payload, isLoading: false, error: null };
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to save settings';
      });
  }
});

export const { 
  setTheme, 
  setRefreshInterval, 
  setWallpaperFilters, 
  resetSettings,
  setLoading,
  setError
} = settingsSlice.actions;

export default settingsSlice.reducer; 