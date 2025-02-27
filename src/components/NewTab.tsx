import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { loadSavedWallpaper, shuffleWallpaper } from '../store/slices/wallpaperSlice';
import { AppDispatch } from '../store';
import Header from './Header';
import Wallpaper from './Wallpaper';
import Clock from './Clock';
import Todo from './Todo';
import Settings from './Settings';
import WallpaperBrowser from './WallpaperBrowser';
import { logError } from '../utils/errorUtils';

/**
 * Main component for the new tab page
 */
const NewTab: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentWallpaper, isShuffleEnabled, shuffleInterval } = useSelector((state: RootState) => state.wallpaper);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showWallpaperBrowser, setShowWallpaperBrowser] = React.useState(false);

  // Load saved wallpaper on mount
  useEffect(() => {
    dispatch(loadSavedWallpaper())
      .unwrap()
      .catch((error) => {
        logError('Failed to load saved wallpaper', error);
      });
  }, [dispatch]);

  // Setup wallpaper shuffle interval
  useEffect(() => {
    if (!isShuffleEnabled || shuffleInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      dispatch(shuffleWallpaper())
        .unwrap()
        .catch((error) => {
          logError('Failed to shuffle wallpaper', error);
        });
    }, shuffleInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(intervalId);
  }, [dispatch, isShuffleEnabled, shuffleInterval]);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <Header 
        onShowSettings={handleShowSettings}
        onShowWallpaperBrowser={handleShowWallpaperBrowser}
      />
      
      <Wallpaper wallpaper={currentWallpaper} />
      
      <div className="relative z-10">
        <Clock />
        <Todo />
      </div>

      {showSettings && (
        <Settings onClose={handleHideSettings} />
      )}

      {showWallpaperBrowser && (
        <WallpaperBrowser onClose={handleHideWallpaperBrowser} />
      )}
    </div>
  );
};

export default NewTab; 