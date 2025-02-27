import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Wallpaper } from '../../types/wallpaper';
import wallpaperService from '../../services/wallpaperService';
import storageService from '../../services/storageService';
import { logError } from '../../utils/errorUtils';

/**
 * Interface for the wallpaper state
 */
export interface WallpaperState {
  currentWallpaper: Wallpaper | null;
  wallpapers: Wallpaper[];
  library: Wallpaper[];
  isLoading: boolean;
  error: string | null;
  isShuffleEnabled: boolean;
  shuffleInterval: number; // in minutes
}

/**
 * Initial state for wallpapers
 */
const initialState: WallpaperState = {
  currentWallpaper: null,
  wallpapers: [],
  library: [],
  isLoading: false,
  error: null,
  isShuffleEnabled: false,
  shuffleInterval: 30
};

/**
 * Async thunk for fetching wallpapers
 */
export const fetchWallpapers = createAsyncThunk(
  'wallpaper/fetchWallpapers',
  async (_, { rejectWithValue }) => {
    try {
      const wallpapers = await wallpaperService.fetchWallpapers();
      return wallpapers;
    } catch (error) {
      logError('Failed to fetch wallpapers', error);
      return rejectWithValue('Failed to fetch wallpapers');
    }
  }
);

/**
 * Async thunk for fetching the library
 */
export const fetchLibrary = createAsyncThunk(
  'wallpaper/fetchLibrary',
  async (_, { rejectWithValue }) => {
    try {
      const library = await storageService.getLibrary();
      return library;
    } catch (error) {
      logError('Failed to fetch library', error);
      return rejectWithValue('Failed to fetch library');
    }
  }
);

/**
 * Async thunk for adding a wallpaper to the library
 */
export const addToLibrary = createAsyncThunk(
  'wallpaper/addToLibrary',
  async (wallpaper: Wallpaper, { rejectWithValue }) => {
    try {
      await storageService.addToLibrary(wallpaper);
      return wallpaper;
    } catch (error) {
      logError('Failed to add wallpaper to library', error);
      return rejectWithValue('Failed to add wallpaper to library');
    }
  }
);

/**
 * Async thunk for removing a wallpaper from the library
 */
export const removeFromLibrary = createAsyncThunk(
  'wallpaper/removeFromLibrary',
  async (wallpaperId: string, { rejectWithValue }) => {
    try {
      await storageService.removeFromLibrary(wallpaperId);
      return wallpaperId;
    } catch (error) {
      logError('Failed to remove wallpaper from library', error);
      return rejectWithValue('Failed to remove wallpaper from library');
    }
  }
);

/**
 * Async thunk for setting the current wallpaper
 */
export const setCurrentWallpaper = createAsyncThunk(
  'wallpaper/setCurrentWallpaper',
  async (wallpaper: Wallpaper, { rejectWithValue }) => {
    try {
      await storageService.saveCurrentWallpaper(wallpaper);
      return wallpaper;
    } catch (error) {
      logError('Failed to set current wallpaper', error);
      return rejectWithValue('Failed to set current wallpaper');
    }
  }
);

/**
 * Async thunk for loading a saved wallpaper
 */
export const loadSavedWallpaper = createAsyncThunk(
  'wallpaper/loadSavedWallpaper',
  async (_, { rejectWithValue }) => {
    try {
      const wallpaper = await storageService.getCurrentWallpaper();
      return wallpaper;
    } catch (error) {
      logError('Failed to load saved wallpaper', error);
      return rejectWithValue('Failed to load saved wallpaper');
    }
  }
);

/**
 * Async thunk for shuffling a wallpaper
 */
export const shuffleWallpaper = createAsyncThunk(
  'wallpaper/shuffleWallpaper',
  async (_, { rejectWithValue }) => {
    try {
      const wallpaper = await storageService.getRandomLibraryWallpaper();
      if (wallpaper) {
        await storageService.saveCurrentWallpaper(wallpaper);
      }
      return wallpaper;
    } catch (error) {
      logError('Failed to shuffle wallpaper', error);
      return rejectWithValue('Failed to shuffle wallpaper');
    }
  }
);

/**
 * Wallpaper slice
 */
const wallpaperSlice = createSlice({
  name: 'wallpaper',
  initialState,
  reducers: {
    setShuffleEnabled: (state, action) => {
      state.isShuffleEnabled = action.payload;
    },
    setShuffleInterval: (state, action) => {
      state.shuffleInterval = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch wallpapers
      .addCase(fetchWallpapers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWallpapers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallpapers = action.payload;
      })
      .addCase(fetchWallpapers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch library
      .addCase(fetchLibrary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLibrary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.library = action.payload;
      })
      .addCase(fetchLibrary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Add to library
      .addCase(addToLibrary.fulfilled, (state, action) => {
        state.library.unshift(action.payload);
      })
      .addCase(addToLibrary.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Remove from library
      .addCase(removeFromLibrary.fulfilled, (state, action) => {
        state.library = state.library.filter(w => w.id !== action.payload);
      })
      .addCase(removeFromLibrary.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Set current wallpaper
      .addCase(setCurrentWallpaper.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setCurrentWallpaper.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWallpaper = action.payload;
      })
      .addCase(setCurrentWallpaper.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Load saved wallpaper
      .addCase(loadSavedWallpaper.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSavedWallpaper.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWallpaper = action.payload;
      })
      .addCase(loadSavedWallpaper.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Shuffle wallpaper
      .addCase(shuffleWallpaper.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(shuffleWallpaper.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.currentWallpaper = action.payload;
        }
      })
      .addCase(shuffleWallpaper.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setShuffleEnabled, setShuffleInterval, clearError } = wallpaperSlice.actions;
export default wallpaperSlice.reducer; 