import React from 'react';
import { Wallpaper as WallpaperType } from '../types/wallpaper';

export interface WallpaperProps {
  wallpaper: WallpaperType | null;
}

const Wallpaper: React.FC<WallpaperProps> = ({ wallpaper }) => {
  if (!wallpaper) {
    return (
      <div className="fixed inset-0 bg-black" />
    );
  }

  return (
    <div className="fixed inset-0">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{ 
          backgroundImage: `url(${wallpaper.path})`,
          opacity: 1
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-30" />
    </div>
  );
};

export default Wallpaper; 