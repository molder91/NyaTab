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
      await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_WALLPAPER]: wallpaper });
      
      // Also add to library if it's not already there
      if (wallpaper.sourceType === 'local') {
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
   * Gets wallpaper library from storage
   */
  getLibrary: async (): Promise<Wallpaper[]> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.LIBRARY);
      return result[STORAGE_KEYS.LIBRARY] || [];
    } catch (error) {
      logError('Failed to get wallpaper library from storage', error);
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
      const library = await storageService.getLibrary();
      
      // Check if wallpaper already exists
      const exists = library.some(w => w.id === wallpaper.id);
      
      if (!exists) {
        // Add to beginning of library
        library.unshift(wallpaper);
        await storageService.saveLibrary(library);
      }
    } catch (error) {
      logError('Failed to add wallpaper to library', error);
      throw error;
    }
  },
  
  /**
   * Removes a wallpaper from the library
   */
  removeFromLibrary: async (wallpaperId: string): Promise<void> => {
    try {
      const library = await storageService.getLibrary();
      const updatedLibrary = library.filter(w => w.id !== wallpaperId);
      await storageService.saveLibrary(updatedLibrary);
    } catch (error) {
      logError('Failed to remove wallpaper from library', error);
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