import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { AppDispatch } from '../store';
import { fetchWallpapers, fetchLibrary, setCurrentWallpaper, addToLibrary, removeFromLibrary, shuffleWallpaper } from '../store/slices/wallpaperSlice';
import { showNotification } from '../store/slices/notificationSlice';
import { setBrowseNsfwFilter } from '../store/slices/settingsSlice';
import { Wallpaper } from '../types/wallpaper';
import { XMarkIcon, ArrowPathIcon, HeartIcon, MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import WallpaperDetails from './WallpaperDetails';
import wallpaperService, { handleFileUpload } from '../services/wallpaperService';
import storageService from '../services/storageService';

type BrowserView = 'browse' | 'library';

export interface WallpaperBrowserProps {
  onClose: () => void;
  onSelectWallpaper?: (wallpaper: Wallpaper) => void;
}

interface FilterOptions {
  resolution?: string;
  minWidth?: number;
  minHeight?: number;
  nsfw?: boolean;
  nsfwMode?: 'off' | 'allowed' | 'only';
  categories?: string[];
  sorting?: string;
  order?: 'asc' | 'desc';
  purity?: string[];
}

// Define interface for detailed view
interface DetailedWallpaperViewProps {
  wallpaper: Wallpaper;
  onClose: () => void;
  onAddToLibrary: (wallpaper: Wallpaper) => void;
  onSetAsWallpaper: (wallpaper: Wallpaper) => void;
  onDownload: (wallpaper: Wallpaper, e: React.MouseEvent) => void;
  isInLibrary: boolean;
}

// Detailed wallpaper view component
const DetailedWallpaperView: React.FC<DetailedWallpaperViewProps> = ({
  wallpaper,
  onClose,
  onAddToLibrary,
  onSetAsWallpaper,
  onDownload,
  isInLibrary
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-5xl h-[85vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-in-out">
        {/* Header with close button */}
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {wallpaper.info?.title || 'Wallpaper Details'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Image and details content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Image container */}
          <div className="flex-1 min-h-[300px] flex items-center justify-center p-4 bg-black/10 dark:bg-black/30 overflow-hidden">
            <img 
              src={wallpaper.path} 
              alt={wallpaper.info?.title || 'Wallpaper'} 
              className="max-w-full max-h-full object-contain shadow-lg rounded"
              loading="lazy"
            />
          </div>
          
          {/* Details panel */}
          <div className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="space-y-6">
              {/* Resolution */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{wallpaper.resolution}</p>
              </div>
              
              {/* Source */}
              {wallpaper.info?.source && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{wallpaper.info.source}</p>
                </div>
              )}
              
              {/* Description */}
              {wallpaper.info?.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{wallpaper.info.description}</p>
                </div>
              )}
              
              {/* Tags */}
              {wallpaper.info?.tags && wallpaper.info.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {wallpaper.info.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* File information for local files */}
              {wallpaper.sourceType === 'local' && wallpaper.info?.fileSize && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">File Information</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    Size: {Math.round(wallpaper.info.fileSize / 1024)} KB
                  </p>
                  {wallpaper.info.mimeType && (
                    <p className="text-gray-900 dark:text-white">
                      Type: {wallpaper.info.mimeType.split('/')[1].toUpperCase()}
                    </p>
                  )}
                </div>
              )}
              
              {/* Buttons */}
              <div className="pt-4 space-y-3">
                <button
                  onClick={() => onSetAsWallpaper(wallpaper)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <PhotoIcon className="w-5 h-5" />
                  <span>Set as Wallpaper</span>
                </button>
              
                {!isInLibrary ? (
                  <button
                    onClick={() => onAddToLibrary(wallpaper)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors duration-200"
                  >
                    <HeartIcon className="w-5 h-5" />
                    <span>Add to Library</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg cursor-not-allowed"
                  >
                    <HeartIconSolid className="w-5 h-5 text-pink-500" />
                    <span>In Library</span>
                  </button>
                )}
                
                <button
                  onClick={(e) => onDownload(wallpaper, e)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WallpaperBrowser: React.FC<WallpaperBrowserProps> = ({ onClose, onSelectWallpaper }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { wallpapers, library, isLoading, error, currentPage, lastPage } = useSelector((state: RootState) => state.wallpaper);
  const { wallpaperFilters, browseNsfwFilter } = useSelector((state: RootState) => state.settings);
  const [currentView, setCurrentView] = useState<BrowserView>('browse');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    resolution: undefined,
    minWidth: undefined,
    minHeight: undefined,
    nsfw: browseNsfwFilter === 'allowed' || browseNsfwFilter === 'only',
    nsfwMode: browseNsfwFilter,
    categories: wallpaperFilters?.categories || ['general', 'anime'],
    sorting: 'random',
    order: 'desc'
  });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [wallpaperToDelete, setWallpaperToDelete] = useState<string | null>(null);
  const [selectedWallpaperDetails, setSelectedWallpaperDetails] = useState<Wallpaper | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSettingWallpaper, setIsSettingWallpaper] = useState(false);

  // Ensure the default browseNsfwFilter is set to 'off' when component first loads
  useEffect(() => {
    // Only set default if not already set by user
    if (typeof browseNsfwFilter === 'undefined') {
      console.log('Setting default browseNsfwFilter to off');
      dispatch(setBrowseNsfwFilter('off'));
    }
    
    console.log('Current browseNsfwFilter:', browseNsfwFilter);
  }, []);

  // Update filters when browseNsfwFilter setting changes
  useEffect(() => {
    console.log('browseNsfwFilter changed to:', browseNsfwFilter);
    setFilters(prev => ({
      ...prev,
      nsfw: browseNsfwFilter === 'allowed' || browseNsfwFilter === 'only',
      nsfwMode: browseNsfwFilter
    }));
    
    // Force refresh to apply filter changes
    if (currentView === 'browse') {
      handleSearch();
    }
  }, [browseNsfwFilter]);

  useEffect(() => {
    if (currentView === 'browse') {
      handleSearch();
    } else {
      dispatch(fetchLibrary());
    }
  }, [dispatch, currentView, browseNsfwFilter]);

  const handleRefreshWallpapers = () => {
    if (currentView === 'browse') {
      handleSearch();
    } else {
      dispatch(fetchLibrary());
    }
  };

  const handleViewChange = (view: BrowserView) => {
    setCurrentView(view);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    const files = fileInput.files;
    
    if (!files || files.length === 0) {
      setUploadError('No file selected');
      return;
    }
    
    const file = files[0];
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadError(null);
    
    console.log(`Starting upload process for file: ${file.name} (${Math.round(file.size / 1024)} KB, type: ${file.type})`);
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      setUploadProgress(null);
      console.error('File is not an image:', file.type);
      return;
    }
    
    try {
      // Show upload progress
      setUploadProgress(10);
      
      // Process file upload using wallpaperService
      console.log('Passing file to handleFileUpload service...');
      const wallpaper = await handleFileUpload(file);
      setUploadProgress(50);
      
      console.log('Wallpaper processed successfully. ID:', wallpaper.id, 'Resolution:', wallpaper.resolution);
      
      // Add to library using dispatch to ensure proper state update
      console.log('Dispatching addToLibrary action...');
      await dispatch(addToLibrary(wallpaper)).unwrap();
      setUploadProgress(90);
      
      // Force refresh the library
      console.log('Refreshing library to display new wallpaper...');
      await dispatch(fetchLibrary()).unwrap();
      setUploadProgress(100);
      
      // Reset file input
      fileInput.value = '';
      setSelectedFile(null);
      
      // Show success notification
      dispatch(showNotification({
        type: 'success',
        message: 'Wallpaper uploaded successfully'
      }));
      
      // Verify the wallpaper was added to the library
      const currentLibrary = await storageService.getLibrary();
      const isInLibrary = currentLibrary.some(w => w.id === wallpaper.id);
      console.log(`Verification: Wallpaper ${wallpaper.id} is ${isInLibrary ? 'in library' : 'NOT in library'}. Library size: ${currentLibrary.length}`);
      
      // Switch to library view and refresh
      setCurrentView('library');
      console.log('Switching to library view after upload');
    } catch (error) {
      console.error('Failed to upload wallpaper:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload wallpaper');
      setUploadProgress(null);
      
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to upload wallpaper: ' + (error instanceof Error ? error.message : String(error))
      }));
    }
  };

  const handleWallpaperSelect = async (wallpaper: Wallpaper) => {
    // If in browse view, show details instead of immediately selecting
    if (currentView === 'browse') {
      setSelectedWallpaperDetails(wallpaper);
      return;
    }
    
    try {
      if (!library.some(w => w.id === wallpaper.id)) {
        await dispatch(addToLibrary(wallpaper)).unwrap();
      }
      
      await dispatch(setCurrentWallpaper(wallpaper)).unwrap();
      
      if (onSelectWallpaper) {
        onSelectWallpaper(wallpaper);
      }
      onClose();
    } catch (error) {
      console.error('Failed to set wallpaper:', error);
    }
  };

  /**
   * Removes a wallpaper from the library
   */
  const handleRemoveFromLibrary = async (wallpaperId: string) => {
    try {
      console.log('Removing wallpaper from library:', wallpaperId);
      
      // Dispatch the action to remove from library
      await dispatch(removeFromLibrary(wallpaperId)).unwrap();
      
      // Show success notification
      dispatch(showNotification({
        type: 'success',
        message: 'Removed from library'
      }));
      
      // Always refresh the library data to ensure it's up to date
      dispatch(fetchLibrary());
      
      // Close the confirmation dialog
      setWallpaperToDelete(null);
    } catch (error) {
      console.error('Failed to remove wallpaper from library:', error);
      
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to remove from library'
      }));
      
      // Close the confirmation dialog
      setWallpaperToDelete(null);
    }
  };

  const handleDownload = async (wallpaper: Wallpaper, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(wallpaper.path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallpaper-${wallpaper.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download wallpaper:', error);
    }
  };

  const handleSearch = useCallback(async () => {
    setIsLoadingSearch(true);
    
    // Build search parameters
    const params = {
      page: 1,
      query: searchQuery,
      filters: {
        sorting: filters.sorting,
        order: filters.order,
        categories: filters.categories || ['general', 'anime'],
        nsfw: browseNsfwFilter === 'allowed' || browseNsfwFilter === 'only',
        nsfwMode: browseNsfwFilter,
        resolution: filters.resolution
      }
    };
    
    console.log('Searching with params:', params, 'Current NSFW mode:', browseNsfwFilter);
    
    try {
      await dispatch(fetchWallpapers({ ...params })).unwrap();
    } catch (error) {
      console.error('Failed to fetch wallpapers:', error);
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to fetch wallpapers. Please try again.'
      }));
    } finally {
      setIsLoadingSearch(false);
    }
  }, [dispatch, searchQuery, filters, browseNsfwFilter]);

  // Add a function to load more wallpapers
  const handleLoadMore = async () => {
    if (isLoadingMore || currentPage >= lastPage) return;
    
    setIsLoadingMore(true);
    
    // Build search parameters using same structure as handleSearch
    const params = {
      page: currentPage + 1,
      query: searchQuery,
      filters: {
        sorting: filters.sorting,
        order: filters.order,
        categories: filters.categories || ['general', 'anime'],
        nsfw: browseNsfwFilter === 'allowed' || browseNsfwFilter === 'only',
        nsfwMode: browseNsfwFilter,
        resolution: filters.resolution
      },
      append: true // Indicate that we want to append to existing wallpapers
    };
    
    console.log('Loading more wallpapers, page:', params.page, 'NSFW mode:', browseNsfwFilter);
    
    try {
      await dispatch(fetchWallpapers({ ...params })).unwrap();
    } catch (error) {
      console.error('Failed to load more wallpapers:', error);
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to load more wallpapers. Please try again.'
      }));
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Adds a wallpaper to the library
   */
  const handleAddToLibrary = async (wallpaper: Wallpaper) => {
    try {
      console.log('Adding wallpaper to library:', wallpaper.id);
      
      // Clone the wallpaper to avoid reference issues
      const wallpaperCopy = { ...wallpaper };
      
      // Dispatch the action to add to library
      console.log('Dispatching addToLibrary action...');
      await dispatch(addToLibrary(wallpaperCopy)).unwrap();
      
      // Show success notification
      dispatch(showNotification({
        type: 'success',
        message: 'Added to library'
      }));
      
      console.log('Successfully added to library, refreshed library contains:', library.length, 'wallpapers');
      
      // Always refresh the library data to ensure it's up to date
      dispatch(fetchLibrary());
    } catch (error) {
      console.error('Failed to add wallpaper to library:', error);
      
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to add to library'
      }));
    }
  };

  // Confirmation dialog for deleting wallpapers
  const renderDeleteConfirmation = () => {
    if (!wallpaperToDelete) return null;
    
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Wallpaper</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to delete this wallpaper from your library? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button 
              onClick={() => setWallpaperToDelete(null)} 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleRemoveFromLibrary(wallpaperToDelete)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleWallpaperClick = (wallpaper: Wallpaper) => {
    if (currentView === 'browse') {
      setSelectedWallpaperDetails(wallpaper);
    } else {
      handleWallpaperSelect(wallpaper);
    }
  };

  const handleCloseDetails = () => {
    setSelectedWallpaperDetails(null);
  };

  /**
   * Sets a wallpaper as the current wallpaper
   */
  const handleSetAsWallpaper = async (wallpaper: Wallpaper) => {
    try {
      console.log('Setting wallpaper:', wallpaper.id);
      setIsSettingWallpaper(true);
      
      // Clone the wallpaper to avoid reference issues
      const wallpaperToSet = { ...wallpaper };
      
      // If it's a browse wallpaper, add it to library first
      if (currentView === 'browse') {
        console.log('Adding browse wallpaper to library before setting as current');
        try {
          await dispatch(addToLibrary(wallpaperToSet)).unwrap();
          console.log('Successfully added to library');
        } catch (error) {
          console.error('Failed to add to library:', error);
          // Continue anyway - we'll still set it as wallpaper
        }
      }
      
      // Set as current wallpaper
      await dispatch(setCurrentWallpaper(wallpaperToSet)).unwrap();
      
      // Show success notification
      dispatch(showNotification({
        type: 'success',
        message: 'Wallpaper set successfully'
      }));
      
      // Refresh the library view if we're in library mode
      if (currentView === 'library') {
        console.log('Refreshing library after setting wallpaper');
        dispatch(fetchLibrary());
      }
      
    } catch (error) {
      console.error('Failed to set wallpaper:', error);
      
      // Show error notification
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to set wallpaper'
      }));
    } finally {
      setIsSettingWallpaper(false);
    }
  };

  // Debug library contents whenever it changes
  useEffect(() => {
    console.log(`Library updated, now has ${library.length} wallpapers`);
    if (library.length > 0) {
      console.log('First wallpaper in library:', library[0].id);
    }
  }, [library]);

  // Force load library on initial mount
  useEffect(() => {
    console.log('Initial mount - fetching library...');
    dispatch(fetchLibrary());
  }, [dispatch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-7xl h-[95vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex">
        {/* Left Sidebar */}
        <div className="w-72 bg-gray-50 dark:bg-gray-900 flex flex-col border-r border-gray-200 dark:border-gray-700">
          {/* View Selector */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex rounded-lg bg-gray-200 dark:bg-gray-800 p-1">
              <button
                onClick={() => handleViewChange('browse')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'browse'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => handleViewChange('library')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'library'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Library
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wallpapers..."
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </form>

            <button 
              onClick={handleRefreshWallpapers}
              className="flex items-center justify-center w-full gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all duration-200"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoadingSearch ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Only show filters in browse view */}
            {currentView === 'browse' && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  <span className="font-medium">Filters</span>
                  <FunnelIcon className="w-5 h-5" />
                </button>

                {showFilters && (
                  <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Resolution Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Resolution
                      </label>
                      <select
                        value={filters.resolution || ''}
                        onChange={(e) => setFilters({ ...filters, resolution: e.target.value || undefined })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-800"
                      >
                        <option value="">Any</option>
                        <option value="1920x1080">1920x1080 (FHD)</option>
                        <option value="2560x1440">2560x1440 (QHD)</option>
                        <option value="3840x2160">3840x2160 (4K)</option>
                      </select>
                    </div>

                    {/* Sorting options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sort By
                      </label>
                      <select
                        value={filters.sorting || 'random'}
                        onChange={(e) => setFilters({ ...filters, sorting: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-800"
                      >
                        <option value="random">Random</option>
                        <option value="relevance">Relevance</option>
                        <option value="date_added">Date Added</option>
                        <option value="views">Most Viewed</option>
                        <option value="favorites">Most Favorited</option>
                        <option value="toplist">Top Rated</option>
                      </select>
                    </div>

                    {/* NSFW Filter - Enhanced version */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        NSFW Content
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setFilters({...filters, nsfw: false, nsfwMode: 'off'});
                            dispatch(setBrowseNsfwFilter('off'));
                          }}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            !filters.nsfw ? 'bg-pink-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          Off (SFW Only)
                        </button>
                        <button
                          onClick={() => {
                            setFilters({...filters, nsfw: true, nsfwMode: 'allowed'});
                            dispatch(setBrowseNsfwFilter('allowed'));
                          }}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            filters.nsfw && filters.nsfwMode !== 'only' ? 'bg-pink-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          Allow NSFW
                        </button>
                        <button
                          onClick={() => {
                            setFilters({...filters, nsfw: true, nsfwMode: 'only'});
                            dispatch(setBrowseNsfwFilter('only'));
                          }}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            filters.nsfw && filters.nsfwMode === 'only' ? 'bg-pink-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          NSFW Only
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Control what type of content you want to see
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Section (Only in Library view) */}
          {currentView === 'library' && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-gray-800 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-pink-500 cursor-pointer">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or GIF</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {uploadProgress !== null && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-pink-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentView === 'browse' ? 'Browse Wallpapers' : 'My Library'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Wallpaper Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingSearch ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={handleRefreshWallpapers}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  Try Again
                </button>
              </div>
            ) : (currentView === 'browse' ? wallpapers : library).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {currentView === 'browse' ? 'No wallpapers found' : 'Your library is empty'}
                </p>
                {currentView === 'browse' && (
                  <button 
                    onClick={handleRefreshWallpapers}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                  >
                    Refresh
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4`}>
                  {(currentView === 'browse' ? wallpapers : library).map((wallpaper) => (
                    <div
                      key={wallpaper.id}
                      onClick={() => handleWallpaperClick(wallpaper)}
                      className="group relative rounded-lg overflow-hidden aspect-video bg-gray-100 dark:bg-gray-700 hover:ring-2 hover:ring-pink-500 transition-all duration-200 cursor-pointer shadow-md"
                    >
                      {/* Static placeholder (no animation) */}
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800"></div>
                      
                      {/* Wallpaper image with better loading */}
                      <img
                        src={wallpaper.thumbnail || wallpaper.path}
                        alt={wallpaper.info?.title || 'Wallpaper'}
                        className="w-full h-full object-cover relative z-10"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback if thumbnail fails
                          const img = e.target as HTMLImageElement;
                          if (img.src !== wallpaper.path) {
                            img.src = wallpaper.path;
                          }
                        }}
                        onLoad={(e) => {
                          // Once loaded, make sure it's visible without animation
                          const img = e.target as HTMLImageElement;
                          img.style.opacity = '1';
                        }}
                      />
                      
                      {/* Hover overlay with gradient background to ensure text is visible regardless of wallpaper color */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20">
                        <div className="flex items-start justify-between">
                          {/* Resolution tag */}
                          <span className="text-xs font-medium bg-black/50 text-white px-2 py-1 rounded backdrop-blur-sm">
                            {wallpaper.resolution}
                          </span>
                          
                          {/* "In library" badge */}
                          {currentView === 'browse' && library.some(w => w.id === wallpaper.id) && (
                            <span className="text-xs font-medium bg-pink-600/80 text-white px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                              <HeartIconSolid className="w-3 h-3" />
                              <span>In Library</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-auto">
                          {/* Wallpaper title */}
                          {wallpaper.info?.title && (
                            <h3 className="text-sm font-medium text-white truncate mb-2 text-shadow">
                              {wallpaper.info.title}
                            </h3>
                          )}
                          
                          {/* Action buttons with improved UI */}
                          <div className="flex items-center justify-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-4 transition-all duration-300">
                            {/* View details button - now shown for all wallpapers including local uploads */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWallpaperDetails(wallpaper);
                              }}
                              className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-800 transition-all duration-200 transform hover:scale-110 backdrop-blur-sm"
                              title="View details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Set as wallpaper button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsWallpaper(wallpaper);
                              }}
                              className="p-2 bg-blue-600/90 hover:bg-blue-700 rounded-full text-white transition-all duration-200 transform hover:scale-110 backdrop-blur-sm"
                              title="Set as wallpaper"
                            >
                              <PhotoIcon className="w-5 h-5" />
                            </button>
                            
                            {currentView === 'browse' && !library.some(w => w.id === wallpaper.id) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToLibrary(wallpaper);
                                }}
                                className="p-2 bg-pink-600/90 hover:bg-pink-700 rounded-full text-white transition-all duration-200 transform hover:scale-110 backdrop-blur-sm"
                                title="Add to library"
                              >
                                <HeartIcon className="w-5 h-5" />
                              </button>
                            )}
                            
                            {currentView === 'library' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWallpaperToDelete(wallpaper.id);
                                }}
                                className="p-2 bg-red-600/90 hover:bg-red-700 rounded-full text-white transition-all duration-200 transform hover:scale-110 backdrop-blur-sm"
                                title="Remove from library"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                            
                            {/* Download button - not shown for local uploads */}
                            {wallpaper.sourceType !== 'local' && (
                              <button
                                onClick={(e) => handleDownload(wallpaper, e)}
                                className="p-2 bg-gray-600/90 hover:bg-gray-700 rounded-full text-white transition-all duration-200 transform hover:scale-110 backdrop-blur-sm"
                                title="Download wallpaper"
                              >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More button - only show in browse view and if there are more pages */}
                {currentView === 'browse' && currentPage < lastPage && (
                  <div className="flex justify-center my-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                        isLoadingMore 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-pink-600 hover:bg-pink-700'
                      } text-white transition-colors duration-200`}
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {renderDeleteConfirmation()}

        {/* Wallpaper details modal */}
        {selectedWallpaperDetails && (
          <DetailedWallpaperView
            wallpaper={selectedWallpaperDetails}
            onClose={handleCloseDetails}
            onAddToLibrary={handleAddToLibrary}
            onSetAsWallpaper={handleSetAsWallpaper}
            onDownload={handleDownload}
            isInLibrary={library.some(w => w.id === selectedWallpaperDetails.id)}
          />
        )}
      </div>
    </div>
  );
};

export default WallpaperBrowser; 