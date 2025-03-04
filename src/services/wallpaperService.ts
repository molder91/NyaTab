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
  
  // ALWAYS ensure anime is included for best results
  if (!categoryString.substr(1, 1).includes('1')) {
    categoryString = categoryString.substr(0, 1) + '1' + categoryString.substr(2);
    console.log('Forcing anime category for better results');
  }
  
  params.append('categories', categoryString);
  
  // Format purity (SFW: 1, Sketchy: 2, NSFW: 3)
  // purityString format: "SFW,Sketchy,NSFW" as a 3-digit binary string
  let purityString = '100'; // Default to SFW only
  
  console.log('Formatting parameters with nsfwMode:', filters.nsfwMode);
  
  // Apply simplified NSFW filtering logic with clear patterns
  switch (filters.nsfwMode) {
    case 'only':
      // NSFW Only: Show only sketchy and NSFW content (011)
      purityString = '011';
      console.log('Using NSFW Only purityString:', purityString);
      break;
    case 'allowed':
      // Allow NSFW: Show all content types (111)
      purityString = '111'; 
      console.log('Using Allow NSFW purityString:', purityString);
      break;
    case 'off':
    default:
      // SFW Only: Show only SFW content (100)
      purityString = '100';
      console.log('Using SFW Only purityString:', purityString);
      break;
  }
  
  params.append('purity', purityString);
  
  // Add other parameters
  if (filters.sorting) params.append('sorting', filters.sorting);
  if (filters.order) params.append('order', filters.order);
  if (filters.query) params.append('q', filters.query);
  
  // Add resolution filter if specified
  if (filters.resolution) params.append('resolution', filters.resolution);
  if (filters.minWidth) params.append('atleast', `${filters.minWidth}x${filters.minHeight || filters.minWidth}`);
  
  // For NSFW only mode, ensure "anime" is included in the search query to get better results
  if (filters.nsfwMode === 'only' && (!filters.query || !filters.query.includes('anime'))) {
    const currentQuery = params.get('q') || '';
    // Add anime-related terms to get better results for NSFW anime content
    if (currentQuery) {
      params.set('q', `${currentQuery} anime hentai ecchi`);
    } else {
      params.set('q', 'anime hentai ecchi');
    }
    console.log('Added anime-related terms to query for NSFW-only mode');
  } else if (!params.get('q')) {
    // Always ensure we have a query parameter with anime for best results
    params.set('q', 'anime');
  }
  
  console.log('Formatted API parameters:', Object.fromEntries(params.entries()), 
             'NSFW mode:', filters.nsfwMode, 
             'Purity string:', purityString);
  
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
    sourceType: 'remote',
    thumbnail: item.thumbs?.small,
    resolution: item.resolution,
    info: {
      title: `Wallhaven ${item.id}`,
      source: item.url,
      uploadDate: item.created_at,
      fileSize: item.file_size,
      mimeType: item.file_type,
      description: `${item.resolution} • ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`,
      tags: item.tags?.map((tag: any) => tag.name) || []
    },
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
 * Handles file upload for wallpapers
 */
export const handleFileUpload = async (file: File): Promise<Wallpaper> => {
  try {
    console.log(`Processing uploaded file: ${file.name}, Size: ${Math.round(file.size / 1024)}KB, Type: ${file.type}`);
    
    if (!file.type.startsWith('image/')) {
      console.error('Uploaded file is not an image:', file.type);
      throw new Error('Uploaded file is not an image');
    }
    
    // Check file size before processing
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`File size exceeds recommended limit (${Math.round(file.size / 1024)}KB > ${Math.round(MAX_FILE_SIZE / 1024)}KB)`);
      // Continue but warn the user
    }
    
    // Create a unique ID for the wallpaper
    const id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create a blob URL for processing
    const blobUrl = URL.createObjectURL(file);
    console.log('Created blob URL for processing:', blobUrl);
    
    // Load the image to get its dimensions
    const img = new Image();
    
    const dimensions = await new Promise<{ width: number, height: number }>((resolve, reject) => {
      img.onload = () => {
        console.log(`Image loaded, dimensions: ${img.width}x${img.height}`);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = (err) => {
        console.error('Failed to load image:', err);
        reject(new Error('Failed to load image - the file may be corrupted'));
      };
      img.src = blobUrl;
    });
    
    // Convert to base64 with compression for storage
    let base64Data: string;
    try {
      base64Data = await compressAndConvertToBase64(file, dimensions, 0.8);
      console.log(`Compressed and converted to base64, data length: ${base64Data.length}`);
    } catch (compressionError) {
      console.error('Compression error:', compressionError);
      throw new Error(`Failed to compress image: ${compressionError instanceof Error ? compressionError.message : 'unknown error'}`);
    }
    
    // Create a thumbnail
    let thumbnailData: string;
    try {
      const thumbnailSize = 200;
      thumbnailData = await createThumbnail(base64Data, thumbnailSize, file.type);
      console.log('Created thumbnail for local wallpaper');
    } catch (thumbnailError) {
      console.error('Thumbnail creation error:', thumbnailError);
      // Use the full image if thumbnail creation fails
      thumbnailData = base64Data;
    }
    
    // Format the resolution string
    const resolution = `${dimensions.width}x${dimensions.height}`;
    
    // Create the wallpaper object
    const wallpaper: Wallpaper = {
      id,
      path: base64Data,
      source: 'local_upload',
      sourceType: 'local',
      thumbnail: thumbnailData,
      resolution,
      info: {
        title: file.name,
        source: 'Local Upload',
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
        description: `Local Upload - ${resolution}`,
        tags: ['local', 'upload']
      },
      addedAt: new Date().toISOString()
    };
    
    // Immediately add to storage to avoid loss
    try {
      console.log('Adding local wallpaper to library:', id);
      await storageService.addToLibrary(wallpaper);
      console.log('Successfully added wallpaper to library:', id);
    } catch (storageError) {
      console.error('Storage error when adding wallpaper to library:', storageError);
      throw new Error(
        `Failed to save wallpaper to library: ${
          storageError instanceof Error 
            ? (storageError.message.includes('quota') 
              ? 'Storage quota exceeded. Try removing some existing wallpapers.' 
              : storageError.message)
            : 'Storage error'
        }`
      );
    }
    
    // Revoke the blob URL as it's no longer needed
    URL.revokeObjectURL(blobUrl);
    
    console.log('Successfully processed uploaded wallpaper:', id);
    return wallpaper;
  } catch (error) {
    console.error('Failed to process uploaded file:', error);
    
    // Ensure we're throwing a string message, not an object
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Unknown error processing file';
    
    throw new Error(`Failed to upload wallpaper: ${errorMessage}`);
  }
};

/**
 * Compresses and converts an image to base64 with the given quality
 * @param file The image file to compress
 * @param dimensions The image dimensions
 * @param quality The compression quality (0-1)
 * @returns A Promise that resolves to the base64 data URL
 */
const compressAndConvertToBase64 = async (
  file: File, 
  dimensions: { width: number, height: number },
  quality: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a blob URL for the file
      const blobUrl = URL.createObjectURL(file);
      
      // Create a canvas to resize the image if it's very large
      const MAX_DIMENSION = 1920; // Maximum width or height for wallpapers
      let targetWidth = dimensions.width;
      let targetHeight = dimensions.height;
      
      // Scale down if necessary while maintaining aspect ratio
      if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
        console.log(`Image is too large (${dimensions.width}x${dimensions.height}), resizing...`);
        
        if (dimensions.width > dimensions.height) {
          // Landscape orientation
          targetWidth = MAX_DIMENSION;
          targetHeight = Math.round(dimensions.height * (MAX_DIMENSION / dimensions.width));
        } else {
          // Portrait or square orientation
          targetHeight = MAX_DIMENSION;
          targetWidth = Math.round(dimensions.width * (MAX_DIMENSION / dimensions.height));
        }
        
        console.log(`Resized to ${targetWidth}x${targetHeight}`);
      }
      
      // Load the image into a temporary image element
      const img = new Image();
      img.onload = () => {
        try {
          // Create a canvas element to draw the image
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Draw the image onto the canvas with resizing
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            URL.revokeObjectURL(blobUrl);
            return;
          }
          
          // Use better quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the image onto the canvas
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          // Convert to base64 with compression
          const base64Data = canvas.toDataURL(file.type, quality);
          console.log(`Compressed image to ${Math.round(base64Data.length / 1024)}KB with quality ${quality}`);
          
          // Revoke the blob URL to avoid memory leaks
          URL.revokeObjectURL(blobUrl);
          
          resolve(base64Data);
        } catch (canvasError) {
          console.error('Canvas error during compression:', canvasError);
          
          // Fallback to FileReader if canvas operations fail
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(new Error('FileReader error: ' + e));
          reader.readAsDataURL(file);
        }
      };
      
      img.onerror = (err) => {
        console.error('Failed to load image for compression:', err);
        URL.revokeObjectURL(blobUrl);
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = blobUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Creates a thumbnail from a base64 image
 */
export const createThumbnail = async (
  base64Data: string, 
  maxSize: number, 
  mimeType: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }
          }
          
          // Create a canvas for the thumbnail
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw the image at the new size
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Unable to get canvas context');
          }
          
          // Use a higher quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to data URL with 0.8 quality (for JPEGs)
          const thumbnailData = canvas.toDataURL(mimeType, 0.8);
          console.log(`Created thumbnail: ${width}x${height}, data length: ${thumbnailData.length}`);
          
          resolve(thumbnailData);
        } catch (err) {
          console.error('Error creating thumbnail:', err);
          reject(err);
        }
      };
      
      img.onerror = (err) => {
        console.error('Failed to load image for thumbnail:', err);
        reject(new Error('Failed to load image for thumbnail'));
      };
      
      img.src = base64Data;
    } catch (err) {
      console.error('Error in thumbnail creation:', err);
      reject(err);
    }
  });
};

/**
 * Searches for wallpapers using the Wallhaven API
 */
export const searchWallpapers = async (
  query = '',
  page = 1,
  customFilters: Partial<WallpaperFilters> = {}
): Promise<{
  wallpapers: Wallpaper[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  }
}> => {
  try {
    console.log(`Searching wallpapers with query: "${query}", page: ${page}, filters:`, customFilters);
    
    // Merge default filters with custom filters
    const filters: WallpaperFilters = {
      ...WALLHAVEN_API.DEFAULT_PARAMS,
      categories: customFilters.categories || ['general', 'anime'],
      purity: customFilters.purity || ['sfw'],
      sorting: customFilters.sorting || 'random',
      order: customFilters.order || 'desc',
      nsfwMode: customFilters.nsfwMode || 'off',
    };
    
    // Explicitly log the NSFW mode to debug
    console.log('NSFW mode for this search:', customFilters.nsfwMode, 'Using mode:', filters.nsfwMode);
    
    if (query) {
      filters.query = query;
    }
    
    // Apply advanced filters if provided
    if (customFilters.resolution) filters.resolution = customFilters.resolution;
    if (customFilters.minWidth) filters.minWidth = customFilters.minWidth;
    if (customFilters.minHeight) filters.minHeight = customFilters.minHeight;
    
    try {
      // Format parameters
      const params = formatParams(filters);
      
      // Add page parameter
      params.append('page', page.toString());
      
      // Build URL
      const url = `${WALLHAVEN_API.BASE_URL}${WALLHAVEN_API.SEARCH_ENDPOINT}?${params.toString()}`;
      console.log('Searching with URL:', url);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        // Make request with timeout
        const response = await fetch(url, { 
          signal: controller.signal,
          // Add headers for better reliability
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        // Clear the timeout since request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Wallhaven API error:', response.status, response.statusText);
          throw new Error(`Wallhaven API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as WallhavenSearchResponse;
        console.log('Wallhaven search results:', data.meta);
        
        // Map to wallpapers
        const wallpapers = data.data.map(mapToWallpaper);
        
        return {
          wallpapers,
          meta: {
            currentPage: data.meta.current_page,
            lastPage: data.meta.last_page,
            perPage: data.meta.per_page,
            total: data.meta.total
          }
        };
      } catch (fetchError) {
        // Handle fetch errors specifically (timeout, network issues, etc.)
        console.error('Fetch error in searchWallpapers:', fetchError);
        
        // Re-throw a cleaner error for the UI to display
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error('Search request timed out. Please try again.');
        } else {
          throw new Error(`Failed to fetch wallpapers: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }
      }
    } catch (paramsError) {
      console.error('Error generating search parameters:', paramsError);
      throw new Error('Failed to process search parameters. Please try different search criteria.');
    }
  } catch (error) {
    // Top-level error handler to ensure we never crash the page
    console.error('Failed to search wallpapers:', error);
    logError('Failed to search wallpapers', error);
    
    // Return empty but valid results instead of throwing an error
    return { 
      wallpapers: [],
      meta: {
        currentPage: 1,
        lastPage: 1,
        perPage: 24,
        total: 0
      }
    };
  }
};

/**
 * Fetches wallpapers from Wallhaven API
 */
const fetchWallpapers = async (): Promise<Wallpaper[]> => {
  try {
    const { wallpapers } = await searchWallpapers('', 1);
    return wallpapers;
  } catch (error) {
    logError('Failed to fetch wallpapers', error);
    return [];
  }
};

/**
 * Fetches a random wallpaper from Wallhaven API
 */
const fetchRandomWallpaper = async (): Promise<Wallpaper> => {
  try {
    console.log('Fetching random wallpaper...');
    
    // Get user settings to respect NSFW preferences
    const settings = await storageService.getSettings();
    const nsfwMode = settings?.refreshNsfwFilter || 'off';
    
    console.log('Using NSFW mode for random wallpaper:', nsfwMode);
    
    // Create filters based on NSFW mode
    const filters: Partial<WallpaperFilters> = {
      nsfwMode,
      nsfw: nsfwMode === 'allowed' || nsfwMode === 'only'
    };
    
    // Pass the filters to searchWallpapers
    const { wallpapers } = await searchWallpapers('', 1, filters);
    
    if (!wallpapers || wallpapers.length === 0) {
      throw new Error('No wallpapers found');
    }
    
    // Select a random wallpaper
    const randomIndex = Math.floor(Math.random() * wallpapers.length);
    const wallpaper = wallpapers[randomIndex];
    
    console.log('Selected wallpaper:', wallpaper.id);
    
    // Save current wallpaper
    await storageService.saveCurrentWallpaper(wallpaper);
    
    // Only add to history
    await addToWallpaperHistory(wallpaper);
    
    return wallpaper;
  } catch (error) {
    console.error('Failed to fetch random wallpaper:', error);
    logError('Failed to fetch random wallpaper', error);
    
    // Try to get previously saved wallpaper
    try {
      const currentWallpaper = await storageService.getCurrentWallpaper();
      if (currentWallpaper) {
        return currentWallpaper;
      }
    } catch (storageError) {
      console.error('Failed to get current wallpaper from storage:', storageError);
    }
    
    throw error;
  }
};

/**
 * Gets the current wallpaper
 */
const getCurrentWallpaper = async (): Promise<Wallpaper | null> => {
  try {
    return await storageService.getCurrentWallpaper();
  } catch (error) {
    logError('Failed to get current wallpaper', error);
    return null;
  }
};

/**
 * Saves the current wallpaper
 */
const saveCurrentWallpaper = async (wallpaper: Wallpaper): Promise<void> => {
  try {
    // For local uploaded images with blob URLs, convert to base64 for persistence
    if (wallpaper.sourceType === 'local' && wallpaper.path.startsWith('blob:')) {
      try {
        // Convert blob URL to base64 data URL
        const response = await fetch(wallpaper.path);
        const blob = await response.blob();
        
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              // Update the wallpaper with the base64 data
              const base64Data = reader.result as string;
              const updatedWallpaper = {
                ...wallpaper,
                path: base64Data,
                thumbnail: base64Data
              };
              
              // Save current wallpaper
              await storageService.saveCurrentWallpaper(updatedWallpaper);
              
              // Only add local uploaded wallpapers to library automatically
              if (updatedWallpaper.sourceType === 'local' && updatedWallpaper.source === 'local_upload') {
                try {
                  await storageService.addToLibrary(updatedWallpaper);
                  console.log('Added local wallpaper to library when setting as current wallpaper');
                } catch (libraryError) {
                  console.error('Failed to add to library when setting as current wallpaper:', libraryError);
                }
              }
              
              // Also add to history
              await addToWallpaperHistory(updatedWallpaper);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Failed to convert blob to base64:', error);
        // Fall back to original method
        await storageService.saveCurrentWallpaper(wallpaper);
        
        // Only add local uploaded wallpapers to library automatically
        if (wallpaper.sourceType === 'local' && wallpaper.source === 'local_upload') {
          try {
            await storageService.addToLibrary(wallpaper);
            console.log('Added local wallpaper to library when setting as current wallpaper');
          } catch (libraryError) {
            console.error('Failed to add to library when setting as current wallpaper:', libraryError);
          }
        }
        
        await addToWallpaperHistory(wallpaper);
      }
    } else {
      // Regular wallpaper saving
      await storageService.saveCurrentWallpaper(wallpaper);
      
      // Only add local uploaded wallpapers to library automatically
      if (wallpaper.sourceType === 'local' && wallpaper.source === 'local_upload') {
        try {
          await storageService.addToLibrary(wallpaper);
          console.log('Added local wallpaper to library when setting as current wallpaper');
        } catch (libraryError) {
          console.error('Failed to add to library when setting as current wallpaper:', libraryError);
        }
      }
      
      await addToWallpaperHistory(wallpaper);
    }
  } catch (error) {
    logError('Failed to save current wallpaper', error);
    throw error;
  }
};

/**
 * Adds a wallpaper to favorites (same as library)
 */
const addToFavorites = async (wallpaper: Wallpaper): Promise<void> => {
  try {
    console.log('Adding wallpaper to favorites:', wallpaper.id);
    // Get existing library first
    const existingLibrary = await storageService.getLibrary();
    
    // Check if wallpaper already exists
    if (existingLibrary.some(w => w.id === wallpaper.id)) {
      console.log('Wallpaper already exists in library:', wallpaper.id);
      return;
    }

    // If this is a local image with a blob URL or data URL, handle it specially
    if (wallpaper.sourceType === 'local') {
      try {
        // If it's already a data URL, we can use it directly
        if (wallpaper.path.startsWith('data:')) {
          // Ensure we have a thumbnail
          const thumbnail = wallpaper.thumbnail || await createThumbnail(wallpaper.path, 200, wallpaper.info.mimeType || 'image/jpeg');
          
          const processedWallpaper: Wallpaper = {
            ...wallpaper,
            thumbnail,
            // Ensure required properties are set
            sourceType: 'local',
            source: 'local_upload',
            info: {
              ...wallpaper.info,
              source: wallpaper.info.source || 'Local Upload'
            }
          };
          
          // Add to library
          await storageService.addToLibrary(processedWallpaper);
          console.log('Added local wallpaper to library:', wallpaper.id);
          return;
        }
        
        // Otherwise, we need to download the image
        console.log('Downloading image from URL:', wallpaper.path);
        
        try {
          // Download the image
          const response = await fetch(wallpaper.path);
          const blob = await response.blob();
          const imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = (err) => {
              console.error('Failed to convert to base64:', err);
              reject(new Error('Failed to convert to base64'));
            };
            reader.readAsDataURL(blob);
          });
          
          const thumbnail = await createThumbnail(imageData, 200, wallpaper.info.mimeType || blob.type);
          
          const processedWallpaper: Wallpaper = {
            ...wallpaper,
            path: imageData,
            thumbnail,
            sourceType: 'local',
            source: 'local_upload',
            info: {
              ...wallpaper.info,
              source: wallpaper.info.source || 'Local Upload'
            }
          };
          
          await storageService.addToLibrary(processedWallpaper);
          console.log('Added processed blob wallpaper to library:', wallpaper.id);
          return;
        } catch (error) {
          console.error('Failed to download image:', error);
          throw error;
        }
      } catch (error) {
        console.error('Failed to process local wallpaper:', error);
        throw error;
      }
    }
    
    // For remote wallpapers or if processing fails, add directly
    await storageService.addToLibrary(wallpaper);
    console.log('Added remote wallpaper to library:', wallpaper.id);
  } catch (error) {
    logError('Failed to add wallpaper to favorites', error);
    throw error;
  }
};

/**
 * Removes a wallpaper from favorites
 */
const removeFromFavorites = async (wallpaperId: string): Promise<void> => {
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
};

/**
 * Service for fetching and managing wallpapers
 * Integrates with Wallhaven API for anime-themed wallpapers
 */
const wallpaperService = {
  /**
   * Search for wallpapers from the API
   */
  searchWallpapers,

  /**
   * Fetches wallpapers from Wallhaven API
   */
  fetchWallpapers,
  
  /**
   * Fetches a random wallpaper from Wallhaven API
   */
  fetchRandomWallpaper,
  
  /**
   * Gets the current wallpaper
   */
  getCurrentWallpaper,
  
  /**
   * Saves the current wallpaper
   */
  saveCurrentWallpaper,
  
  /**
   * Adds a wallpaper to favorites (same as library)
   */
  addToFavorites,
  
  /**
   * Removes a wallpaper from favorites
   */
  removeFromFavorites,
  
  /**
   * Gets wallpaper history
   */
  getWallpaperHistory
};

export default wallpaperService;

// Export individual functions for testing
export { formatParams, mapToWallpaper, getWallpaperHistory, addToWallpaperHistory }; 