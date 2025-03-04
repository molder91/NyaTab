import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  Cog6ToothIcon, 
  PhotoIcon, 
  ArrowPathIcon,
  BookmarkIcon,
  ClockIcon,
  CloudIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import { getMessage } from '../utils/i18n';
import { openUrl } from '../utils/urlUtils';
import { getExtensionUrl } from '../utils/chromeUtils';
import { AppDispatch } from '../store';
import { shuffleWallpaper } from '../store/slices/wallpaperSlice';

interface HeaderProps {
  onShowSettings: () => void;
  onShowWallpaperBrowser: () => void;
}

/**
 * Header component for the new tab page
 */
const Header: React.FC<HeaderProps> = ({ onShowSettings, onShowWallpaperBrowser }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { library } = useSelector((state: RootState) => state.wallpaper);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useSelector((state: RootState) => state.settings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    onShowSettings();
  };

  const handleWallpaperBrowserClick = () => {
    setIsMenuOpen(false);
    onShowWallpaperBrowser();
  };

  // Handle opening the options page
  const handleOpenOptions = () => {
    openUrl(getExtensionUrl('options.html'));
  };

  // Handle refreshing the wallpaper
  const handleRefreshWallpaper = async () => {
    if (library.length === 0) return;
    
    setIsRefreshing(true);
    try {
      await dispatch(shuffleWallpaper({ silent: true })).unwrap();
    } catch (error) {
      console.error('Failed to refresh wallpaper:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="absolute top-0 right-0 z-30 p-4">
      <div className="relative" ref={menuRef}>
        {/* Menu Button */}
        <button
          onClick={toggleMenu}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg shadow-lg hover:bg-white/30 transition-all duration-300 ease-in-out transform hover:scale-105"
          aria-label="Open Menu"
        >
          <img src="../assets/images/logo-small.png" alt="NyaTab" className="w-8 h-8" onError={(e) => {
            // Fallback if logo image fails to load
            (e.target as HTMLElement).innerHTML = 'NT';
            (e.target as HTMLElement).className = 'text-white font-bold text-lg';
          }} />
        </button>

        {/* Dropdown Menu */}
        <div 
          className={`absolute right-0 mt-2 w-64 rounded-xl bg-white/20 backdrop-blur-xl shadow-xl transition-all duration-300 ease-in-out transform origin-top-right 
            ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          <div className="px-2 py-3 border-b border-white/20">
            <h3 className="text-white font-medium text-center text-lg">NyaTab Menu</h3>
          </div>
          
          <div className="p-2">
            <button
              onClick={handleWallpaperBrowserClick}
              className="flex items-center w-full px-4 py-3 text-white hover:bg-white/30 rounded-lg transition-colors duration-200"
            >
              <PhotoIcon className="w-5 h-5 mr-3" />
              <span>Browse Wallpapers</span>
            </button>
            
            <button
              onClick={handleSettingsClick}
              className="flex items-center w-full px-4 py-3 text-white hover:bg-white/30 rounded-lg transition-colors duration-200"
            >
              <Cog6ToothIcon className="w-5 h-5 mr-3" />
              <span>Settings</span>
            </button>
            
            {/* Future Features (Currently Disabled) */}
            <div className="mt-2 border-t border-white/20 pt-2">
              <button 
                disabled
                className="flex items-center w-full px-4 py-3 text-white/50 rounded-lg cursor-not-allowed"
              >
                <BookmarkIcon className="w-5 h-5 mr-3" />
                <span>Bookmarks</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">Soon</span>
              </button>
              
              <button 
                disabled
                className="flex items-center w-full px-4 py-3 text-white/50 rounded-lg cursor-not-allowed"
              >
                <CloudIcon className="w-5 h-5 mr-3" />
                <span>Weather</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">Soon</span>
              </button>
              
              <button 
                disabled
                className="flex items-center w-full px-4 py-3 text-white/50 rounded-lg cursor-not-allowed"
              >
                <ClockIcon className="w-5 h-5 mr-3" />
                <span>Pomodoro Timer</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">Soon</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 