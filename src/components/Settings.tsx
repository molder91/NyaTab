import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  setTheme, 
  setRefreshInterval, 
  setWallpaperFilters
} from '../store/slices/settingsSlice';
import storageService from '../services/storageService';
import { getMessage } from '../utils/i18n';
import { Theme, applyTheme, detectSystemTheme } from '../utils/theme';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { AppDispatch } from '../store';
import { setShuffleEnabled, setShuffleInterval } from '../store/slices/wallpaperSlice';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Component for displaying and managing settings
 */
const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { isShuffleEnabled, shuffleInterval } = useSelector((state: RootState) => state.wallpaper);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Save settings to storage whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        setIsSaving(true);
        await storageService.saveSettings(settings);
        setSaveMessage(getMessage('settingsSaved'));
        
        // Clear the save message after 3 seconds
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } catch (err) {
        console.error('Error saving settings:', err);
        setSaveMessage(getMessage('settingsSaveError'));
      } finally {
        setIsSaving(false);
      }
    };

    saveSettings();
  }, [settings]);

  // Handle theme change
  const handleThemeChange = (theme: Theme) => {
    dispatch(setTheme(theme));
  };

  // Handle refresh interval change
  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    dispatch(setRefreshInterval(value));
  };

  // Handle wallpaper filter change
  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = [...settings.wallpaperFilters.categories];
    
    if (checked && !currentCategories.includes(category)) {
      dispatch(setWallpaperFilters({
        categories: [...currentCategories, category]
      }));
    } else if (!checked && currentCategories.includes(category)) {
      dispatch(setWallpaperFilters({
        categories: currentCategories.filter(c => c !== category)
      }));
    }
  };

  // Handle purity filter change
  const handlePurityChange = (purity: string, checked: boolean) => {
    const currentPurity = [...settings.wallpaperFilters.purity];
    
    if (checked && !currentPurity.includes(purity)) {
      dispatch(setWallpaperFilters({
        purity: [...currentPurity, purity]
      }));
    } else if (!checked && currentPurity.includes(purity)) {
      dispatch(setWallpaperFilters({
        purity: currentPurity.filter(p => p !== purity)
      }));
    }
  };

  // Handle sorting change
  const handleSortingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setWallpaperFilters({
      sorting: e.target.value
    }));
  };

  // Handle order change
  const handleOrderChange = (order: 'asc' | 'desc') => {
    dispatch(setWallpaperFilters({
      order
    }));
  };

  const handleShuffleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setShuffleEnabled(event.target.checked));
  };

  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setShuffleInterval(parseInt(event.target.value, 10)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-black/80 backdrop-blur-sm text-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={() => {}}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Wallpaper Settings</h3>
            
            <div className="flex items-center justify-between">
              <label htmlFor="shuffle-toggle" className="flex items-center cursor-pointer">
                <span className="mr-3">Auto-shuffle wallpapers</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="shuffle-toggle"
                    className="sr-only"
                    checked={isShuffleEnabled}
                    onChange={handleShuffleToggle}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${
                    isShuffleEnabled ? 'bg-pink-600' : 'bg-gray-600'
                  }`} />
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                    isShuffleEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>

            {isShuffleEnabled && (
              <div className="flex items-center justify-between pl-4">
                <label htmlFor="shuffle-interval" className="text-sm">
                  Change wallpaper every:
                </label>
                <select
                  id="shuffle-interval"
                  value={shuffleInterval}
                  onChange={handleIntervalChange}
                  className="ml-4 px-3 py-1 bg-white/10 rounded-md border border-white/20 focus:outline-none focus:border-pink-500"
                >
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="180">3 hours</option>
                  <option value="360">6 hours</option>
                  <option value="720">12 hours</option>
                  <option value="1440">24 hours</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 