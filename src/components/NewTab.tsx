import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { loadSavedWallpaper, shuffleWallpaper, setCurrentWallpaper, addToLibrary } from '../store/slices/wallpaperSlice';
import { loadSettings } from '../store/slices/settingsSlice';
import { AppDispatch } from '../store';
import Header from './Header';
import Wallpaper from './Wallpaper';
import Clock from './Clock';
import Todo from './Todo';
import Settings from './Settings';
import WallpaperBrowser from './WallpaperBrowser';
import Notifications from './Notifications';
import { logError } from '../utils/errorUtils';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import wallpaperService from '../services/wallpaperService';
import { showNotification } from '../store/slices/notificationSlice';
import { HeartIcon } from '@heroicons/react/24/outline';

/**
 * Main component for the new tab page
 */
const NewTab: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentWallpaper, isShuffleEnabled, shuffleInterval, shuffleOnNewTab, library } = useSelector((state: RootState) => state.wallpaper);
  const { wallpaperFilters, changeWallpaperOnNewTab, refreshSource } = useSelector((state: RootState) => state.settings);
  const [showSettings, setShowSettings] = useState(false);
  const [showWallpaperBrowser, setShowWallpaperBrowser] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWallpaperActions, setShowWallpaperActions] = useState(false);

  // Extract the NSFW setting from settings
  const refreshNsfwFilter = useSelector((state: RootState) => state.settings.refreshNsfwFilter || 'off');

  // Check if current wallpaper is in library
  const isInLibrary = useMemo(() => {
    if (!currentWallpaper || !library.length) return false;
    return library.some(w => w.id === currentWallpaper.id);
  }, [currentWallpaper, library]);

  // Load saved wallpaper on mount
  useEffect(() => {
    // Load saved wallpaper and settings in sequence
    const loadInitialData = async () => {
      try {
        // Load settings first
        await dispatch(loadSettings()).unwrap();
        
        // Then load the wallpaper
        await dispatch(loadSavedWallpaper()).unwrap();
        
        console.log('Successfully loaded saved wallpaper and settings');
      } catch (error) {
        logError('Failed to load initial data', error);
      }
    };
    
    loadInitialData();
  }, [dispatch]);

  // Listen for messages from the background script
  useEffect(() => {
    const handleMessages = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.type === 'SHUFFLE_WALLPAPER') {
        console.log('Received shuffle wallpaper message from background script', message);
        
        // If refresh source is specified in the message, use it, otherwise use the current setting
        const sourceToUse = message.refreshSource || refreshSource;
        const nsfwFilterToUse = message.nsfwFilter || refreshNsfwFilter;
        
        console.log('Using refresh source:', sourceToUse);
        console.log('Using NSFW filter:', nsfwFilterToUse);
        
        // For library source, check if we have wallpapers
        if (sourceToUse === 'library' && library.length === 0) {
          console.log('Cannot shuffle: library is empty');
          sendResponse({ success: false, error: 'Library is empty' });
          return true;
        }
        
        // Shuffle wallpaper with the specified source and NSFW filter
        dispatch(shuffleWallpaper({ 
          source: sourceToUse, 
          nsfwFilter: nsfwFilterToUse,
          silent: true // Prevent notifications during shuffle
        }))
          .unwrap()
          .then(() => {
            console.log('Successfully shuffled wallpaper via message');
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Failed to shuffle wallpaper via message:', error);
            sendResponse({ success: false, error: error.toString() });
          });
        
        return true; // Indicates we'll call sendResponse asynchronously
      }
      return false;
    };

    console.log('Setting up message listener in NewTab');
    chrome.runtime.onMessage.addListener(handleMessages);
    
    return () => {
      console.log('Removing message listener in NewTab');
      chrome.runtime.onMessage.removeListener(handleMessages);
    };
  }, [library.length, refreshSource]);

  // Setup wallpaper shuffle interval
  useEffect(() => {
    if (!isShuffleEnabled || shuffleInterval <= 0 || library.length === 0) {
      return;
    }

    console.log(`Setting up interval shuffle every ${shuffleInterval} minutes`);
    const intervalId = setInterval(() => {
      dispatch(shuffleWallpaper({ silent: true }))
        .unwrap()
        .catch((error) => {
          logError('Failed to shuffle wallpaper', error);
        });
    }, shuffleInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(intervalId);
  }, [dispatch, isShuffleEnabled, shuffleInterval, library.length]);

  const handleRefreshWallpaper = async (sourceOverride?: 'library' | 'browse') => {
    try {
      setIsRefreshing(true);
      
      // Use the override source if provided, otherwise use the one from settings
      const sourceToUse = sourceOverride || refreshSource;
      
      const result = await dispatch(shuffleWallpaper({
        source: sourceToUse,
        nsfwFilter: refreshNsfwFilter,
        silent: true // Prevent notifications when shuffling
      })).unwrap();
      
      console.log('Refreshed wallpaper successfully', result);
      return { success: true };
    } catch (error) {
      console.error('Error refreshing wallpaper:', error);
      return { success: false, error: (error as Error).message };
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleHideSettings = () => {
    setShowSettings(false);
  };

  const handleShowWallpaperBrowser = () => {
    setShowWallpaperBrowser(true);
  };

  const handleHideWallpaperBrowser = () => {
    setShowWallpaperBrowser(false);
  };

  const handleAddToLibrary = async () => {
    if (!currentWallpaper || isInLibrary) return;
    
    try {
      await dispatch(addToLibrary(currentWallpaper)).unwrap();
      
      // Show notification
      dispatch(showNotification({
        type: 'success',
        message: 'Wallpaper added to library'
      }));
    } catch (error) {
      logError('Failed to add wallpaper to library', error);
      
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to add wallpaper to library'
      }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header 
        onShowSettings={handleShowSettings}
        onShowWallpaperBrowser={handleShowWallpaperBrowser}
      />
      
      <Wallpaper wallpaper={currentWallpaper} />
      
      {/* Wallpaper interaction area - becomes visible on hover */}
      <div 
        className="fixed inset-0 z-10"
        onMouseEnter={() => setShowWallpaperActions(true)}
        onMouseLeave={() => setShowWallpaperActions(false)}
      >
        {/* Wallpaper action buttons - only visible on hover */}
        <div 
          className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 p-2 bg-black/30 backdrop-blur-md rounded-full transition-all duration-300 ${
            showWallpaperActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
        >
          {/* Add to Library button - only show if wallpaper is not in library */}
          {!isInLibrary && currentWallpaper && (
            <button
              onClick={handleAddToLibrary}
              className="p-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
              title="Add to Library"
            >
              <HeartIcon className="w-6 h-6" />
            </button>
          )}
          
          {/* Refresh Button */}
          <button 
            onClick={() => handleRefreshWallpaper()}
            disabled={isRefreshing}
            className={`p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 transform hover:scale-110 ${
              isRefreshing ? 'animate-pulse' : ''
            }`}
            title="Refresh wallpaper"
          >
            <ArrowPathIcon 
              className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
      </div>
      
      <div className="relative z-10 transition-all duration-500 ease-in-out">
        <Clock />
        <Todo />
      </div>

      {showSettings && (
        <Settings onClose={handleHideSettings} />
      )}

      {showWallpaperBrowser && (
        <WallpaperBrowser onClose={handleHideWallpaperBrowser} />
      )}

      <Notifications />
    </div>
  );
};

export default NewTab; 