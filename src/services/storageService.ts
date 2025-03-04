import { SettingsState } from '../store/slices/settingsSlice';
import { TodoState } from '../store/slices/todoSlice';
import { Wallpaper } from '../types/wallpaper';
import { logError } from '../utils/errorUtils';

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'settings',
  TODOS: 'nyatab_todos',
  WALLPAPERS: 'wallpapers',
  CURRENT_WALLPAPER: 'currentWallpaper',
  LIBRARY: 'wallpaperLibrary'
};

/**
 * Service for managing extension storage
 */
const storageService = {
  /**
   * Gets settings from storage
   */
  getSettings: async () => {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
      return result[STORAGE_KEYS.SETTINGS];
    } catch (error) {
      logError('Failed to get settings from storage', error);
      return null;
    }
  },
  
  /**
   * Saves settings to storage
   */
  saveSettings: async (settings: any) => {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });
    } catch (error) {
      logError('Failed to save settings to storage', error);
      throw error;
    }
  },
  
  /**
   * Gets current wallpaper from storage
   */
  getCurrentWallpaper: async (): Promise<Wallpaper | null> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_WALLPAPER);
      return result[STORAGE_KEYS.CURRENT_WALLPAPER] || null;
    } catch (error) {
      logError('Failed to get current wallpaper from storage', error);
      return null;
    }
  },
  
  /**
   * Saves current wallpaper to storage
   */
  saveCurrentWallpaper: async (wallpaper: Wallpaper): Promise<void> => {
    try {
      console.log('Saving current wallpaper to storage:', wallpaper.id);
      await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_WALLPAPER]: wallpaper });
      
      // Only add local wallpapers to library automatically (user uploaded)
      // Remote wallpapers should only be added when user explicitly adds them
      if (wallpaper.sourceType === 'local' && wallpaper.source === 'local_upload') {
        console.log('Local uploaded wallpaper - adding to library automatically');
        await storageService.addToLibrary(wallpaper);
      }
    } catch (error) {
      logError('Failed to save current wallpaper to storage', error);
      throw error;
    }
  },
  
  /**
   * Gets wallpapers from storage
   */
  getWallpapers: async (): Promise<Wallpaper[]> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WALLPAPERS);
      return result[STORAGE_KEYS.WALLPAPERS] || [];
    } catch (error) {
      logError('Failed to get wallpapers from storage', error);
      return [];
    }
  },
  
  /**
   * Saves wallpapers to storage
   */
  saveWallpapers: async (wallpapers: Wallpaper[]): Promise<void> => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.WALLPAPERS]: wallpapers });
    } catch (error) {
      logError('Failed to save wallpapers to storage', error);
      throw error;
    }
  },
  
  /**
   * Gets the library of wallpapers
   */
  getLibrary: async (): Promise<Wallpaper[]> => {
    try {
      console.log('Retrieving library from storage...');
      const result = await chrome.storage.local.get(STORAGE_KEYS.LIBRARY);
      const library = result[STORAGE_KEYS.LIBRARY] || [];
      console.log(`Retrieved library with ${library.length} wallpapers`);
      return library;
    } catch (error) {
      console.error('Failed to get library:', error);
      return [];
    }
  },
  
  /**
   * Saves wallpaper library to storage
   */
  saveLibrary: async (wallpapers: Wallpaper[]): Promise<void> => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.LIBRARY]: wallpapers });
    } catch (error) {
      logError('Failed to save wallpaper library to storage', error);
      throw error;
    }
  },
  
  /**
   * Adds a wallpaper to the library
   */
  addToLibrary: async (wallpaper: Wallpaper): Promise<void> => {
    try {
      console.log('Storage: Adding wallpaper to library:', wallpaper.id);
      
      // Get current library
      const library = await storageService.getLibrary();
      
      // Check if wallpaper is already in library
      if (library.some(w => w.id === wallpaper.id)) {
        console.log('Wallpaper already exists in library:', wallpaper.id);
        return; // Skip adding if already exists
      }
      
      // Check size of wallpaper before adding
      const wallpaperSize = JSON.stringify(wallpaper).length;
      const estimatedSize = Math.round(wallpaperSize / 1024);
      console.log(`Wallpaper size: ~${estimatedSize}KB`);
      
      // Warn if wallpaper is large (may hit quota)
      if (estimatedSize > 1024) { // > 1MB
        console.warn(`Large wallpaper detected (${estimatedSize}KB), may approach storage quota`);
      }
      
      // Add to library
      const updatedLibrary = [wallpaper, ...library];
      
      // Try to save to storage
      try {
        await storageService.saveLibrary(updatedLibrary);
        console.log('Successfully added wallpaper to library in storage:', wallpaper.id);
      } catch (error) {
        if (error instanceof Error && error.message.includes('quota')) {
          console.error('Storage quota exceeded when adding to library');
          
          // Try to save a compressed version
          if (wallpaper.path && wallpaper.path.startsWith('data:image')) {
            console.log('Attempting to compress wallpaper before saving');
            try {
              // Create a more compressed thumbnail instead of the full image
              if (wallpaper.thumbnail) {
                console.log('Using thumbnail as main image to save space');
                wallpaper.path = wallpaper.thumbnail;
                
                // Try to save again with smaller image
                await storageService.saveLibrary([wallpaper, ...library]);
                console.log('Successfully saved compressed version to library');
                return;
              }
            } catch (compressionError) {
              console.error('Failed to save compressed version:', compressionError);
            }
          }
          
          throw new Error('Storage quota exceeded. Try removing some wallpapers from your library.');
        }
        
        throw error; // Re-throw other errors
      }
    } catch (error) {
      console.error('Failed to add wallpaper to library in storage:', error);
      
      // Format error message for user display
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown storage error';
      
      throw new Error(`Failed to add to library: ${errorMessage}`);
    }
  },
  
  /**
   * Removes a wallpaper from the library
   */
  removeFromLibrary: async (wallpaperId: string): Promise<void> => {
    try {
      console.log('Removing wallpaper from library:', wallpaperId);
      
      // Get existing library
      const library = await storageService.getLibrary();
      
      // Remove wallpaper from library
      const updatedLibrary = library.filter(w => w.id !== wallpaperId);
      
      if (library.length === updatedLibrary.length) {
        console.warn('Wallpaper not found in library:', wallpaperId);
      }
      
      // Save updated library
      await chrome.storage.local.set({ [STORAGE_KEYS.LIBRARY]: updatedLibrary });
      console.log(`Saved library with ${updatedLibrary.length} wallpapers (removed ${wallpaperId})`);
    } catch (error) {
      console.error('Failed to remove wallpaper from library:', error);
      throw error;
    }
  },
  
  /**
   * Gets a random wallpaper from the library
   */
  getRandomLibraryWallpaper: async (): Promise<Wallpaper | null> => {
    try {
      const library = await storageService.getLibrary();
      
      if (library.length === 0) {
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * library.length);
      return library[randomIndex];
    } catch (error) {
      logError('Failed to get random wallpaper from library', error);
      return null;
    }
  },

  /**
   * Save todos to storage
   * @param todos - Todos to save
   */
  saveTodos: async (todos: TodoState['todos']): Promise<void> => {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEYS.TODOS]: todos });
    } catch (error) {
      logError('Failed to save todos', error);
      throw error;
    }
  },

  /**
   * Get todos from storage
   * @returns Array of todos or empty array if not found
   */
  getTodos: async (): Promise<TodoState['todos']> => {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.TODOS);
      return result[STORAGE_KEYS.TODOS] || [];
    } catch (error) {
      logError('Failed to get todos', error);
      throw error;
    }
  },

  /**
   * Clear all storage data
   */
  clearAll: async (): Promise<void> => {
    try {
      await Promise.all([
        chrome.storage.sync.clear(),
        chrome.storage.local.clear()
      ]);
    } catch (error) {
      logError('Failed to clear storage', error);
      throw error;
    }
  }
};

export default storageService; 