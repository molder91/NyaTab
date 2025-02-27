import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { AppDispatch } from '../store';
import { fetchWallpapers, fetchLibrary, setCurrentWallpaper, addToLibrary, removeFromLibrary } from '../store/slices/wallpaperSlice';
import { Wallpaper } from '../types/wallpaper';
import { XMarkIcon, ArrowPathIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

type BrowserView = 'browse' | 'library';

export interface WallpaperBrowserProps {
  onClose: () => void;
}

const WallpaperBrowser: React.FC<WallpaperBrowserProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { wallpapers, library, isLoading, error } = useSelector((state: RootState) => state.wallpaper);
  const [currentView, setCurrentView] = useState<BrowserView>('browse');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (currentView === 'browse') {
      dispatch(fetchWallpapers());
    } else {
      dispatch(fetchLibrary());
    }
  }, [dispatch, currentView]);

  const handleViewChange = (view: BrowserView) => {
    setCurrentView(view);
  };

  const handleWallpaperSelect = async (wallpaper: Wallpaper) => {
    try {
      await dispatch(setCurrentWallpaper(wallpaper)).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to set wallpaper:', error);
    }
  };

  const handleAddToLibrary = async (wallpaper: Wallpaper) => {
    try {
      await dispatch(addToLibrary(wallpaper)).unwrap();
    } catch (error) {
      console.error('Failed to add wallpaper to library:', error);
    }
  };

  const handleRemoveFromLibrary = async (wallpaperId: string) => {
    try {
      await dispatch(removeFromLibrary(wallpaperId)).unwrap();
    } catch (error) {
      console.error('Failed to remove wallpaper from library:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const renderWallpaperGrid = (items: Wallpaper[]) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {items.map((wallpaper) => (
          <div
            key={wallpaper.id}
            className="group relative aspect-video rounded-lg overflow-hidden cursor-pointer"
            onClick={() => handleWallpaperSelect(wallpaper)}
          >
            <img
              src={wallpaper.thumbnail || wallpaper.path}
              alt={`Wallpaper ${wallpaper.id}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center">
                <span className="text-white text-sm">{wallpaper.resolution}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const isInLibrary = library.some((w) => w.id === wallpaper.id);
                    if (isInLibrary) {
                      handleRemoveFromLibrary(wallpaper.id);
                    } else {
                      handleAddToLibrary(wallpaper);
                    }
                  }}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {library.some((w) => w.id === wallpaper.id) ? (
                    <HeartIconSolid className="w-5 h-5 text-pink-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      <div className="bg-black/80 backdrop-blur-sm text-white w-64 p-4 flex flex-col">
        <div className="space-y-4">
          <button
            onClick={() => handleViewChange('browse')}
            className={`w-full px-4 py-2 rounded-lg transition-colors ${
              currentView === 'browse'
                ? 'bg-pink-600 text-white'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => handleViewChange('library')}
            className={`w-full px-4 py-2 rounded-lg transition-colors ${
              currentView === 'library'
                ? 'bg-pink-600 text-white'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            Library
          </button>

          {currentView === 'library' && (
            <div className="pt-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="wallpaper-upload"
              />
              <label
                htmlFor="wallpaper-upload"
                className="block w-full px-4 py-2 text-center rounded-lg bg-pink-600 hover:bg-pink-700 transition-colors cursor-pointer"
              >
                Upload Wallpaper
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {currentView === 'browse' ? 'Browse Wallpapers' : 'Your Library'}
          </h2>
          <div className="flex items-center space-x-2">
            {currentView === 'browse' && !isLoading && (
              <button
                onClick={() => dispatch(fetchWallpapers())}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowPathIcon className="w-6 h-6 text-white" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">{error}</div>
            </div>
          ) : currentView === 'browse' ? (
            renderWallpaperGrid(wallpapers)
          ) : (
            renderWallpaperGrid(library)
          )}
        </div>
      </div>
    </div>
  );
};

export default WallpaperBrowser; 