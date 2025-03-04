import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCurrentWallpaper, addToLibrary } from '../store/slices/wallpaperSlice';
import { setTheme, setRefreshInterval, setWallpaperFilters, saveSettings } from '../store/slices/settingsSlice';
import WallpaperBrowser from '../components/WallpaperBrowser';
import Button from '../components/ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import wallpaperService from '../services/wallpaperService';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const { isLoading } = useAppSelector(state => state.settings);
  
  const [activeTab, setActiveTab] = useState('general');
  const [showWallpaperBrowser, setShowWallpaperBrowser] = useState(false);
  
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value as 'light' | 'dark' | 'system';
    dispatch(setTheme(theme));
    dispatch(saveSettings({ theme }));
  };
  
  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const refreshInterval = parseInt(e.target.value, 10);
    dispatch(setRefreshInterval(refreshInterval));
    dispatch(saveSettings({ refreshInterval }));
  };
  
  const handleCategoriesChange = (category: string) => {
    const currentCategories = [...settings.wallpaperFilters.categories];
    const index = currentCategories.indexOf(category);
    
    if (index === -1) {
      // Add category
      currentCategories.push(category);
    } else {
      // Remove category
      currentCategories.splice(index, 1);
    }
    
    // Ensure at least one category is selected
    if (currentCategories.length === 0) {
      currentCategories.push('anime');
    }
    
    const newFilters = {
      ...settings.wallpaperFilters,
      categories: currentCategories
    };
    
    dispatch(setWallpaperFilters(newFilters));
    dispatch(saveSettings({ wallpaperFilters: newFilters }));
  };
  
  const handlePurityChange = (purity: string) => {
    const currentPurity = [...settings.wallpaperFilters.purity];
    const index = currentPurity.indexOf(purity);
    
    if (index === -1) {
      // Add purity level
      currentPurity.push(purity);
    } else {
      // Remove purity level
      currentPurity.splice(index, 1);
    }
    
    // Ensure at least one purity level is selected
    if (currentPurity.length === 0) {
      currentPurity.push('sfw');
    }
    
    const newFilters = {
      ...settings.wallpaperFilters,
      purity: currentPurity
    };
    
    dispatch(setWallpaperFilters(newFilters));
    dispatch(saveSettings({ wallpaperFilters: newFilters }));
  };
  
  const handleSortingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sorting = e.target.value;
    
    const newFilters = {
      ...settings.wallpaperFilters,
      sorting
    };
    
    dispatch(setWallpaperFilters(newFilters));
    dispatch(saveSettings({ wallpaperFilters: newFilters }));
  };
  
  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const order = e.target.value as 'asc' | 'desc';
    
    const newFilters = {
      ...settings.wallpaperFilters,
      order
    };
    
    dispatch(setWallpaperFilters(newFilters));
    dispatch(saveSettings({ wallpaperFilters: newFilters }));
  };
  
  const handleWallpaperSelect = (wallpaper: any) => {
    dispatch(setCurrentWallpaper(wallpaper));
  };
  
  const handleBrowseWallpapers = () => {
    setShowWallpaperBrowser(true);
  };

  const handleRefreshWallpaper = async () => {
    try {
      const wallpaper = await wallpaperService.fetchRandomWallpaper();
      dispatch(setCurrentWallpaper(wallpaper));
      dispatch(addToLibrary(wallpaper));
    } catch (error) {
      console.error('Failed to refresh wallpaper:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Settings</h1>
      
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Appearance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Theme
                  </label>
                  <select
                    id="theme"
                    value={settings.theme}
                    onChange={handleThemeChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wallpaper Refresh Interval
                  </label>
                  <select
                    id="refreshInterval"
                    value={settings.refreshInterval}
                    onChange={handleRefreshIntervalChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="0">Never</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="180">3 hours</option>
                    <option value="360">6 hours</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'wallpaper' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Wallpaper Settings</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleBrowseWallpapers}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <span>Browse Wallpapers</span>
                </Button>
                <Button
                  onClick={handleRefreshWallpaper}
                  variant="secondary"
                  className="p-2"
                  title="Refresh Wallpaper"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categories
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="category-general"
                      checked={settings.wallpaperFilters.categories.includes('general')}
                      onChange={() => handleCategoriesChange('general')}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="category-general" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      General
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="category-anime"
                      checked={settings.wallpaperFilters.categories.includes('anime')}
                      onChange={() => handleCategoriesChange('anime')}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="category-anime" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Anime
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="category-people"
                      checked={settings.wallpaperFilters.categories.includes('people')}
                      onChange={() => handleCategoriesChange('people')}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="category-people" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      People
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Rating
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="purity-sfw"
                      checked={settings.wallpaperFilters.purity.includes('sfw')}
                      onChange={() => handlePurityChange('sfw')}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="purity-sfw" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Safe for Work
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="purity-sketchy"
                      checked={settings.wallpaperFilters.purity.includes('sketchy')}
                      onChange={() => handlePurityChange('sketchy')}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="purity-sketchy" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Sketchy
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="sorting" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sorting
                </label>
                <select
                  id="sorting"
                  value={settings.wallpaperFilters.sorting}
                  onChange={handleSortingChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="date_added">Date Added</option>
                  <option value="relevance">Relevance</option>
                  <option value="random">Random</option>
                  <option value="views">Views</option>
                  <option value="favorites">Favorites</option>
                  <option value="toplist">Toplist</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order
                </label>
                <select
                  id="order"
                  value={settings.wallpaperFilters.order}
                  onChange={handleOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">About NyaTab</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                NyaTab is an anime-themed new tab extension for Chrome. It provides a beautiful anime wallpaper experience with useful features to enhance your browsing.
              </p>
              
              <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-100">Features</h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                <li>Beautiful anime wallpapers from Wallhaven</li>
                <li>Customizable refresh intervals</li>
                <li>Dark and light themes</li>
                <li>To-do list management</li>
                <li>Wallpaper browsing and searching</li>
              </ul>
              
              <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-100">Credits</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Wallpapers provided by <a href="https://wallhaven.cc" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600">Wallhaven</a>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Version 1.0.0
              </p>
            </div>
          </div>
        )}
      </div>

      {showWallpaperBrowser && (
        <WallpaperBrowser
          onClose={() => setShowWallpaperBrowser(false)}
          onSelectWallpaper={(wallpaper) => {
            handleWallpaperSelect(wallpaper);
            setShowWallpaperBrowser(false);
          }}
        />
      )}
    </div>
  );
};

export default Settings; 