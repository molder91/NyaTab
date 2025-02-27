import { Wallpaper, WallhavenSearchResponse, WallpaperSourceType } from '../types/wallpaper';
import { logError } from '../utils/errorUtils';
import storageService from './storageService';
import { WallpaperFilters } from '../store/slices/settingsSlice';

// Wallhaven API constants
const WALLHAVEN_API = {
  BASE_URL: 'https://wallhaven.cc/api/v1',
  SEARCH_ENDPOINT: '/search',
  DEFAULT_PARAMS: {
    categories: '010', // Only anime category (second digit is 1)
    purity: '100',     // Only SFW content (first digit is 1)
    sorting: 'random',
    order: 'desc',
    q: 'anime',
    page: '1'
  }
};

/**
 * Formats API parameters for Wallhaven search
 */
const formatParams = (filters: WallpaperFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Format categories (General: 1, Anime: 2, People: 3)
  let categoryString = '000';
  if (filters.categories.includes('general')) {
    categoryString = categoryString.substr(0, 0) + '1' + categoryString.substr(1);
  }
  if (filters.categories.includes('anime')) {
    categoryString = categoryString.substr(0, 1) + '1' + categoryString.substr(2);
  }
  if (filters.categories.includes('people')) {
    categoryString = categoryString.substr(0, 2) + '1';
  }
  
  // Ensure at least one category is selected
  if (categoryString === '000') {
    categoryString = '010'; // Default to anime
  }
  
  params.append('categories', categoryString);
  
  // Format purity (SFW: 1, Sketchy: 2)
  let purityString = '000';
  if (filters.purity.includes('sfw')) {
    purityString = purityString.substr(0, 0) + '1' + purityString.substr(1);
  }
  if (filters.purity.includes('sketchy')) {
    purityString = purityString.substr(0, 1) + '1' + purityString.substr(2);
  }
  
  // Ensure at least SFW is selected
  if (purityString === '000') {
    purityString = '100'; // Default to SFW
  }
  
  params.append('purity', purityString);
  
  // Add sorting and order
  params.append('sorting', filters.sorting || 'random');
  params.append('order', filters.order || 'desc');
  
  // Add anime tag to search query if not already included
  const queryValue = filters.query || 'anime';
  params.append('q', queryValue);
  
  return params;
};

/**
 * Maps Wallhaven API data to our Wallpaper interface
 */
const mapToWallpaper = (item: any): Wallpaper => {
  return {
    id: item.id,
    path: item.path,
    source: item.url,
    sourceType: 'wallhaven' as WallpaperSourceType,
    thumbnail: item.thumbs?.small,
    resolution: item.resolution,
    info: `${item.resolution} • ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`,
    addedAt: new Date().toISOString()
  };
};

/**
 * Gets wallpaper history for the user
 */
const getWallpaperHistory = async (): Promise<Wallpaper[]> => {
  try {
    // Use the getWallpapers method
    const wallpapers = await storageService.getWallpapers();
    return wallpapers || [];
  } catch (error) {
    logError('Failed to get wallpaper history', error);
    return [];
  }
};

/**
 * Adds a wallpaper to the user's history
 */
const addToWallpaperHistory = async (wallpaper: Wallpaper): Promise<void> => {
  try {
    // Get existing wallpapers
    const wallpapers = await storageService.getWallpapers();
    
    // Check if wallpaper already exists in the list
    const existingIndex = wallpapers.findIndex(w => w.id === wallpaper.id);
    
    if (existingIndex !== -1) {
      // Remove the existing entry so we can add it to the front
      wallpapers.splice(existingIndex, 1);
    }
    
    // Add new wallpaper to the beginning of list
    wallpapers.unshift(wallpaper);
    
    // Limit list to 50 items
    const trimmedWallpapers = wallpapers.slice(0, 50);
    
    // Save updated list
    await storageService.saveWallpapers(trimmedWallpapers);
  } catch (error) {
    logError('Failed to add wallpaper to history', error);
  }
};

/**
 * Service for fetching and managing wallpapers
 * Integrates with Wallhaven API for anime-themed wallpapers
 */
const wallpaperService = {
  /**
   * Fetches a random wallpaper from Wallhaven API
   */
  fetchRandomWallpaper: async (): Promise<Wallpaper> => {
    try {
      console.log('Fetching random wallpaper...');
      
      // Get user settings
      const settings = await storageService.getSettings();
      
      if (!settings) {
        console.error('Settings not found in storage');
        throw new Error('Settings not found');
      }
      
      // Get API parameters from user's filters
      const params = formatParams(settings.wallpaperFilters);
      console.log('Fetching wallpaper with params:', params.toString());
      
      // Try using direct API call with proper headers
      try {
        // Add headers to avoid CORS issues
        const requestOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        };
        
        const apiUrl = `${WALLHAVEN_API.BASE_URL}${WALLHAVEN_API.SEARCH_ENDPOINT}?${params}`;
        console.log('Calling Wallhaven API at:', apiUrl);
        
        // Fetch from Wallhaven API
        const response = await fetch(apiUrl, requestOptions);
        
        if (!response.ok) {
          console.error(`Wallhaven API error: ${response.status} - ${response.statusText}`);
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
          console.error('No wallpapers found in API response', data);
          throw new Error('No wallpapers found');
        }
        
        console.log(`Found ${data.data.length} wallpapers, selecting one at random`);
        // Select a random wallpaper
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const wallpaper = mapToWallpaper(data.data[randomIndex]);
        
        console.log('Selected wallpaper:', wallpaper.id);
        
        // Save current wallpaper
        await storageService.saveCurrentWallpaper(wallpaper);
        
        // Add to history
        await addToWallpaperHistory(wallpaper);
        
        return wallpaper;
      } catch (apiError) {
        console.error('Primary API fetch failed, trying fallback method', apiError);
        throw apiError; // Let the outer catch handle it
      }
    } catch (error) {
      console.error('Failed to fetch random wallpaper:', error);
      logError('Failed to fetch random wallpaper', error);
      
      // Try to get previously saved wallpaper
      try {
        console.log('Trying to get current wallpaper from storage...');
        const saved = await storageService.getCurrentWallpaper();
        if (saved) {
          console.log('Using previously saved wallpaper as fallback:', saved.id);
          return saved;
        }
      } catch (fallbackError) {
        console.error('Failed to get fallback wallpaper from storage:', fallbackError);
      }
      
      // Try to get wallpaper from history
      try {
        console.log('Trying to get wallpaper from history...');
        const history = await getWallpaperHistory();
        if (history && history.length > 0) {
          const randomIndex = Math.floor(Math.random() * history.length);
          console.log(`Using wallpaper from history at index ${randomIndex} as fallback:`, history[randomIndex].id);
          return history[randomIndex];
        }
      } catch (historyError) {
        console.error('Failed to get wallpaper from history:', historyError);
      }
      
      // Ultimate fallback - use a predefined wallpaper
      console.log('Using hardcoded fallback wallpaper');
      const fallbackWallpaper = {
        id: 'fallback',
        path: 'https://w.wallhaven.cc/full/l3/wallhaven-l3xk6q.jpg',
        sourceType: 'wallhaven' as WallpaperSourceType,
        source: 'https://wallhaven.cc/w/l3xk6q',
        info: 'Fallback Wallpaper',
        addedAt: new Date().toISOString()
      };
      
      // Save fallback as current wallpaper
      await storageService.saveCurrentWallpaper(fallbackWallpaper);
      
      return fallbackWallpaper;
    }
  },
  
  /**
   * Searches for wallpapers based on query and filters
   */
  searchWallpapers: async (
    query: string,
    page: number = 1,
    filters?: WallpaperFilters
  ): Promise<{ wallpapers: Wallpaper[]; meta: { lastPage: number; total: number } }> => {
    try {
      // Get filters from settings if not provided
      let searchFilters = filters;
      if (!searchFilters) {
        const settings = await storageService.getSettings();
        searchFilters = settings?.wallpaperFilters;
      }
      
      if (!searchFilters) {
        throw new Error('Wallpaper filters not found');
      }
      
      // Prepare search parameters
      const params = formatParams(searchFilters);
      if (query) params.set('q', `${query} anime`);
      params.set('page', page.toString());
      
      // Fetch results
      const response = await fetch(`${WALLHAVEN_API.BASE_URL}${WALLHAVEN_API.SEARCH_ENDPOINT}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map results to our format
      const wallpapers = data.data?.map(mapToWallpaper) || [];
      
      return {
        wallpapers,
        meta: {
          lastPage: data.meta?.last_page || 1,
          total: data.meta?.total || 0
        }
      };
    } catch (error) {
      logError('Failed to search wallpapers', error);
      return { wallpapers: [], meta: { lastPage: 1, total: 0 } };
    }
  },
  
  /**
   * Gets the current wallpaper
   */
  getCurrentWallpaper: async (): Promise<Wallpaper | null> => {
    try {
      return await storageService.getCurrentWallpaper();
    } catch (error) {
      logError('Failed to get current wallpaper', error);
      return null;
    }
  },
  
  /**
   * Saves the current wallpaper
   */
  saveCurrentWallpaper: async (wallpaper: Wallpaper): Promise<void> => {
    try {
      await storageService.saveCurrentWallpaper(wallpaper);
    } catch (error) {
      logError('Failed to save current wallpaper', error);
      throw error;
    }
  },
  
  /**
   * Adds a wallpaper to favorites
   */
  addToFavorites: async (wallpaper: Wallpaper): Promise<void> => {
    // Just add to the regular wallpapers list for now
    await addToWallpaperHistory(wallpaper);
  },
  
  /**
   * Removes a wallpaper from favorites
   */
  removeFromFavorites: async (wallpaperId: string): Promise<void> => {
    try {
      // Get existing wallpapers
      const wallpapers = await storageService.getWallpapers();
      
      // Remove wallpaper from list
      const updatedWallpapers = wallpapers.filter(w => w.id !== wallpaperId);
      
      // Save updated list
      await storageService.saveWallpapers(updatedWallpapers);
    } catch (error) {
      logError('Failed to remove wallpaper from favorites', error);
    }
  },
  
  /**
   * Gets wallpaper history
   */
  getWallpaperHistory
};

export default wallpaperService;

// Export individual functions for testing
export { formatParams, mapToWallpaper, getWallpaperHistory, addToWallpaperHistory }; 