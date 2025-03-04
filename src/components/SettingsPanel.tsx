import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  setWallpaperSource, 
  setChangeWallpaperOnNewTab, 
  setBlurAmount, 
  setSaveBlurSettings,
  setRefreshSource,
  setAutoRotateHorizontal
} from '../store/slices/settingsSlice';

export interface SettingsPanelProps {
  onClose: () => void;
}

const WallpaperSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    wallpaperSource, 
    changeWallpaperOnNewTab, 
    blurAmount, 
    saveBlurSettings,
    refreshSource,
    autoRotateHorizontal
  } = useSelector((state: RootState) => state.settings);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Wallpaper Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize how wallpapers are displayed and changed
        </p>
      </div>

      {/* Random Wallpaper Source */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Random Wallpaper Source
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Choose where to get random wallpapers from
        </p>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="wallpaperSource"
              checked={wallpaperSource === 'library'}
              onChange={() => dispatch(setWallpaperSource('library'))}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              My Library
            </span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="wallpaperSource"
              checked={wallpaperSource === 'browse'}
              onChange={() => dispatch(setWallpaperSource('browse'))}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Browse Collection
            </span>
          </label>
        </div>
      </div>

      {/* Refresh Source */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Refresh Source
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Choose where to get wallpapers when refreshing
        </p>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="refreshSource"
              checked={refreshSource === 'library'}
              onChange={() => dispatch(setRefreshSource('library'))}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              My Library
            </span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="refreshSource"
              checked={refreshSource === 'browse'}
              onChange={() => dispatch(setRefreshSource('browse'))}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Browse Collection
            </span>
          </label>
        </div>
      </div>

      {/* Change Wallpaper on New Tab */}
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="change-on-new-tab" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Change Wallpaper on New Tab
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Automatically display a new random wallpaper when opening a new tab
          </p>
        </div>
        <div className="ml-4">
          <label className="inline-flex relative items-center cursor-pointer">
            <input
              type="checkbox"
              id="change-on-new-tab"
              checked={changeWallpaperOnNewTab}
              onChange={(e) => dispatch(setChangeWallpaperOnNewTab(e.target.checked))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
          </label>
        </div>
      </div>

      {/* Blur Settings */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="blur-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Wallpaper Blur Amount
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {blurAmount}%
          </span>
        </div>
        <input
          type="range"
          id="blur-amount"
          min="0"
          max="100"
          step="5"
          value={blurAmount}
          onChange={(e) => dispatch(setBlurAmount(parseInt(e.target.value)))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
        />
      </div>

      {/* Save Blur Settings */}
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="save-blur-settings" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Save Blur Settings
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Remember blur settings when opening new tabs
          </p>
        </div>
        <div className="ml-4">
          <label className="inline-flex relative items-center cursor-pointer">
            <input
              type="checkbox"
              id="save-blur-settings"
              checked={saveBlurSettings}
              onChange={(e) => dispatch(setSaveBlurSettings(e.target.checked))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
          </label>
        </div>
      </div>

      {/* Auto-rotate horizontal wallpapers */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <label htmlFor="auto-rotate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto-rotate horizontal wallpapers
          </label>
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="auto-rotate"
              checked={autoRotateHorizontal}
              onChange={(e) => dispatch(setAutoRotateHorizontal(e.target.checked))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Automatically rotate horizontal wallpapers for better fit on vertical screens
        </p>
      </div>
    </div>
  );
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  // ... existing code ...

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* ... existing code ... */}
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* ... existing sections ... */}
          
          {/* Add Wallpaper Settings Section */}
          <WallpaperSettings />
          
          {/* ... other sections ... */}
        </div>
        
        {/* ... existing code ... */}
      </div>
    </div>
  );
};

// ... existing code ... 