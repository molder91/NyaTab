import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Wallpaper } from '../../types/wallpaper';
import wallpaperService from '../../services/wallpaperService';
import storageService from '../../services/storageService';
import { logError } from '../../utils/errorUtils';
import { WallpaperFilters } from '../slices/settingsSlice';
import { RootState } from '../../store';
import { showNotification } from '../slices/notificationSlice';

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
  shuffleOnNewTab: boolean;
  currentPage: number;
  lastPage: number;
  totalWallpapers: number;
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
  shuffleInterval: 30,
  shuffleOnNewTab: false,
  currentPage: 1,
  lastPage: 1,
  totalWallpapers: 0
};

/**
 * Async thunk for fetching wallpapers
 */
export const fetchWallpapers = createAsyncThunk(
  'wallpaper/fetchWallpapers',
  async ({ query = '', page = 1, filters = {}, append = false }: { 
    query?: string; 
    page?: number; 
    filters?: Partial<WallpaperFilters>;
    append?: boolean;
  }, { getState }) => {
    console.log('fetchWallpapers thunk called with:', { query, page, filters, append });
    const result = await wallpaperService.searchWallpapers(query, page, filters);
    
    // Return both the wallpapers and pagination info
    return {
      wallpapers: result.wallpapers,
      meta: result.meta,
      append // Whether to append to existing wallpapers or replace them
    };
  }
);

/**
 * Async thunk for fetching the library
 */
export const fetchLibrary = createAsyncThunk(
  'wallpaper/fetchLibrary',
  async (_, { dispatch }) => {
    try {
      console.log('Fetching wallpaper library');
      const library = await storageService.getLibrary();
      
      // Make sure we're not getting any duplicates
      const uniqueLibrary = Array.from(
        new Map(library.map(item => [item.id, item])).values()
      );
      
      if (uniqueLibrary.length !== library.length) {
        console.log(`Removed ${library.length - uniqueLibrary.length} duplicate wallpapers`);
        // Save the de-duplicated library
        await storageService.saveLibrary(uniqueLibrary);
      }
      
      return uniqueLibrary;
    } catch (error) {
      console.error('Failed to fetch library:', error);
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to load your wallpaper library'
      }));
      return [];
    }
  }
);

/**
 * Async thunk for adding a wallpaper to the library
 */
export const addToLibrary = createAsyncThunk(
  'wallpaper/addToLibrary',
  async (wallpaper: Wallpaper, { dispatch }) => {
    try {
      console.log('Adding wallpaper to library:', wallpaper.id);
      
      // Create a deep copy to avoid reference issues
      const wallpaperCopy = JSON.parse(JSON.stringify(wallpaper)) as Wallpaper;
      
      // Make sure the path is a complete data URL for local wallpapers
      if (wallpaperCopy.sourceType === 'local' && !wallpaperCopy.path.startsWith('data:')) {
        try {
          // Ensure we have a full data URL
          console.log('Converting local wallpaper path to full data URL');
          if (wallpaperCopy.path.startsWith('blob:')) {
            const response = await fetch(wallpaperCopy.path);
            const blob = await response.blob();
            const reader = new FileReader();
            wallpaperCopy.path = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.error('Failed to process local wallpaper path:', error);
          // If we can't convert, we'll use the original path and hope for the best
        }
      }
      
      // Record the time this was added to library
      wallpaperCopy.addedAt = new Date().toISOString();
      
      // Add to storage
      try {
        await storageService.addToLibrary(wallpaperCopy);
        console.log('Successfully added to library in storage');
        
        // Show success notification
        dispatch(showNotification({
          type: 'success',
          message: 'Wallpaper added to library'
        }));
        
        return wallpaperCopy;
      } catch (storageError) {
        console.error('Storage error when adding to library:', storageError);
        
        // Provide a more specific error message for quota issues
        let errorMessage = 'Failed to add to library';
        if (storageError instanceof Error) {
          if (storageError.message.includes('quota')) {
            errorMessage = 'Storage quota exceeded. Try removing some wallpapers.';
          } else {
            errorMessage = storageError.message;
          }
        }
        
        dispatch(showNotification({
          type: 'error',
          message: errorMessage
        }));
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to add wallpaper to library:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to add wallpaper to library';
      
      // Show error notification
      dispatch(showNotification({
        type: 'error',
        message: errorMessage
      }));
      
      throw new Error(errorMessage);
    }
  }
);

/**
 * Async thunk for removing a wallpaper from the library
 */
export const removeFromLibrary = createAsyncThunk(
  'wallpaper/removeFromLibrary',
  async (wallpaperId: string, { getState, dispatch }) => {
    try {
      console.log('Removing wallpaper from library:', wallpaperId);
      const state = getState() as RootState;
      const { library, currentWallpaper } = state.wallpaper;
      
      // Check if wallpaper exists in library
      const wallpaperExists = library.some(w => w.id === wallpaperId);
      if (!wallpaperExists) {
        console.error('Wallpaper not found in library:', wallpaperId);
        throw new Error('Wallpaper not found in library');
      }
      
      // Use the storage service directly to ensure it's removed from storage
      await storageService.removeFromLibrary(wallpaperId);
      
      // Get the updated library to ensure we have the latest state
      const updatedLibrary = await storageService.getLibrary();
      console.log(`Library now has ${updatedLibrary.length} wallpapers after removal`);
      
      // If current wallpaper was removed, set a new one
      if (currentWallpaper && currentWallpaper.id === wallpaperId) {
        if (updatedLibrary.length > 0) {
          console.log('Current wallpaper was removed, setting new one from library');
          const randomIndex = Math.floor(Math.random() * updatedLibrary.length);
          const newWallpaper = updatedLibrary[randomIndex];
          await wallpaperService.saveCurrentWallpaper(newWallpaper);
        } else {
          console.log('Library is now empty, fetching new wallpaper');
          const newWallpaper = await wallpaperService.fetchRandomWallpaper();
          await wallpaperService.saveCurrentWallpaper(newWallpaper);
        }
      }
      
      // Show success notification
      dispatch(showNotification({
        type: 'success',
        message: 'Wallpaper removed from library'
      }));
      
      return updatedLibrary;
    } catch (error) {
      console.error('Failed to remove wallpaper from library:', error);
      
      // Show error notification
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to remove wallpaper from library'
      }));
      
      throw error;
    }
  }
);

/**
 * Async thunk for setting the current wallpaper
 */
export const setCurrentWallpaper = createAsyncThunk(
  'wallpaper/setCurrentWallpaper',
  async (wallpaper: Wallpaper) => {
    await wallpaperService.saveCurrentWallpaper(wallpaper);
    return wallpaper;
  }
);

/**
 * Loads the saved wallpaper from storage
 * First loads the library, then gets the current wallpaper
 */
export const loadSavedWallpaper = createAsyncThunk(
  'wallpaper/loadSavedWallpaper',
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      console.log('Loading saved wallpaper...');
      
      // First, load the library
      await dispatch(fetchLibrary()).unwrap();
      
      // Then try to get the current wallpaper
      const wallpaper = await storageService.getCurrentWallpaper();
      console.log('Current wallpaper from storage:', wallpaper?.id || 'none');
      
      // If there's no saved wallpaper but we have a library, use the first one
      const state = getState() as RootState;
      
      if (!wallpaper && state.wallpaper.library.length > 0) {
        console.log('No current wallpaper found, using first one from library');
        return state.wallpaper.library[0];
      }
      
      // If no wallpaper and no library, return null
      if (!wallpaper) {
        console.log('No wallpaper found and library is empty');
        return null;
      }
      
      // Ensure the current wallpaper is in the library
      const isInLibrary = state.wallpaper.library.some(w => w.id === wallpaper.id);
      if (!isInLibrary) {
        console.log('Current wallpaper not in library, adding it:', wallpaper.id);
        try {
          await dispatch(addToLibrary(wallpaper)).unwrap();
          console.log('Successfully added current wallpaper to library');
        } catch (libraryError) {
          console.error('Failed to add current wallpaper to library:', libraryError);
          // Continue anyway - we'll still use it as the current wallpaper
        }
      }
      
      console.log('Successfully loaded wallpaper:', wallpaper.id);
      return wallpaper;
    } catch (error) {
      console.error('Failed to load saved wallpaper:', error);
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
  async (params: { 
    source?: 'library' | 'browse', 
    nsfwFilter?: 'off' | 'allowed' | 'only',
    silent?: boolean // Add optional parameter to silence notifications
  } = {}, { getState, dispatch }) => {
    try {
      const state = getState() as RootState;
      // Use provided source or default from settings
      const refreshSource = params.source || state.settings.refreshSource;
      const nsfwFilter = params.nsfwFilter || state.settings.refreshNsfwFilter;
      const { library, currentWallpaper } = state.wallpaper;
      
      console.log(`Shuffling wallpaper using source: ${refreshSource}, NSFW filter: ${nsfwFilter}`);
      
      let availableWallpapers: Wallpaper[] = [];
      
      // Get wallpapers based on refresh source setting
      if (refreshSource === 'library') {
        if (library.length === 0) {
          throw new Error('Your library is empty. Please add some wallpapers first or change the refresh source to browse.');
        }
        availableWallpapers = library;
        
        // Apply NSFW filtering if needed
        if (nsfwFilter !== 'off') {
          availableWallpapers = availableWallpapers.filter(w => {
            // Check if purity is nsfw or if the tag list contains nsfw related tags
            const isNsfw = w.info.tags?.some(tag => tag.toLowerCase().includes('nsfw')) || 
                          (w as any).purity === 'nsfw';
                          
            if (nsfwFilter === 'only') {
              return isNsfw;
            } else { // allowed
              return true; // Both SFW and NSFW are allowed
            }
          });
          
          if (availableWallpapers.length === 0) {
            throw new Error('No wallpapers match your NSFW filter. Please adjust your filter settings or add more wallpapers.');
          }
        }
      } else {
        // Fetch new wallpapers from API with the specified NSFW filter
        const result = await wallpaperService.searchWallpapers(
          '',  // default empty query
          1,   // default to first page
          {    // custom filters object
            nsfw: nsfwFilter === 'allowed' || nsfwFilter === 'only',
            nsfwMode: nsfwFilter
          }
        );
        
        if (!result || result.wallpapers.length === 0) {
          throw new Error('No wallpapers available from browse collection. Please try again later.');
        }
        availableWallpapers = result.wallpapers;
      }
      
      // Pick a random wallpaper that's different from current
      let attempts = 0;
      const maxAttempts = availableWallpapers.length;
      let randomWallpaper: Wallpaper;
      
      do {
        const randomIndex = Math.floor(Math.random() * availableWallpapers.length);
        randomWallpaper = availableWallpapers[randomIndex];
        attempts++;
      } while (
        currentWallpaper &&
        randomWallpaper.id === currentWallpaper.id &&
        attempts < maxAttempts &&
        availableWallpapers.length > 1
      );
      
      // Only add to library if from library source or already in library
      // For browse source, let user explicitly add it to library with the button
      const isInLibrary = library.some(w => w.id === randomWallpaper.id);
      if (refreshSource === 'library' && !isInLibrary) {
        // This shouldn't happen normally as library refresh uses wallpapers already in library
        // But just in case, make sure the wallpaper is added to library
        console.log('Adding library-sourced wallpaper to library:', randomWallpaper.id);
        try {
          await dispatch(addToLibrary(randomWallpaper)).unwrap();
        } catch (libraryError) {
          console.error('Failed to add library-sourced wallpaper to library:', libraryError);
        }
      }
      
      // Save current wallpaper
      await wallpaperService.saveCurrentWallpaper(randomWallpaper);
      
      // No longer show notifications
      // Only log success message
      console.log(`Changed wallpaper successfully from ${refreshSource}`);
      
      return randomWallpaper;
    } catch (error) {
      console.error('Failed to shuffle wallpaper:', error);
      
      // Don't show notification for errors either
      // Just log error and rethrow
      throw error;
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
    setShuffleOnNewTab: (state, action) => {
      state.shuffleOnNewTab = action.payload;
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
        if (action.payload.append) {
          // Append new wallpapers to existing ones
          state.wallpapers = [...state.wallpapers, ...action.payload.wallpapers];
        } else {
          // Replace existing wallpapers
          state.wallpapers = action.payload.wallpapers;
        }
        state.currentPage = action.payload.meta.currentPage;
        state.lastPage = action.payload.meta.lastPage;
        state.totalWallpapers = action.payload.meta.total;
      })
      .addCase(fetchWallpapers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch wallpapers';
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
        state.error = action.error.message || 'Failed to fetch library';
      })
      
      // Add to library
      .addCase(addToLibrary.fulfilled, (state, action) => {
        if (!state.library.some(w => w.id === action.payload.id)) {
          state.library.unshift(action.payload);
        }
      })
      .addCase(addToLibrary.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Remove from library
      .addCase(removeFromLibrary.fulfilled, (state, action) => {
        state.library = action.payload;
      })
      .addCase(removeFromLibrary.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Set current wallpaper
      .addCase(setCurrentWallpaper.fulfilled, (state, action) => {
        state.currentWallpaper = action.payload;
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
        state.currentWallpaper = action.payload;
      })
      .addCase(shuffleWallpaper.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to shuffle wallpaper';
      });
  }
});

export const { setShuffleEnabled, setShuffleInterval, setShuffleOnNewTab, clearError } = wallpaperSlice.actions;
export default wallpaperSlice.reducer; 