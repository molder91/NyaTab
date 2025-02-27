import React from 'react';
import { Menu } from '@headlessui/react';
import { Cog6ToothIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { getMessage } from '../utils/i18n';
import { openUrl } from '../utils/urlUtils';
import { getExtensionUrl } from '../utils/chromeUtils';

export interface HeaderProps {
  onShowSettings: () => void;
  onShowWallpaperBrowser: () => void;
}

/**
 * Header component for the new tab page
 */
const Header: React.FC<HeaderProps> = ({ onShowSettings, onShowWallpaperBrowser }) => {
  // Handle opening the options page
  const handleOpenOptions = () => {
    openUrl(getExtensionUrl('options.html'));
  };

  return (
    <header className="fixed top-0 right-0 z-20 p-4">
      <Menu as="div" className="relative">
        <Menu.Button className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors">
          <Cog6ToothIcon className="w-6 h-6 text-white" />
        </Menu.Button>
        
        <Menu.Items className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-sm rounded-lg shadow-lg py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onShowWallpaperBrowser}
                className={`${
                  active ? 'bg-white/10' : ''
                } flex items-center w-full px-4 py-2 text-sm text-white`}
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                Browse Wallpapers
              </button>
            )}
          </Menu.Item>
          
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onShowSettings}
                className={`${
                  active ? 'bg-white/10' : ''
                } flex items-center w-full px-4 py-2 text-sm text-white`}
              >
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Settings
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </header>
  );
};

export default Header; 