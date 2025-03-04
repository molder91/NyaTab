import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Wallpaper as WallpaperType } from '../types/wallpaper';

// Simple placeholder image as data URL
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxMDEwMTAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gd2FsbHBhcGVyIGxvYWRlZDwvdGV4dD48L3N2Zz4=';

interface WallpaperProps {
  wallpaper: WallpaperType | null;
}

const Wallpaper: React.FC<WallpaperProps> = ({ wallpaper }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Get blurAmount from settings
  const { blurAmount, darknessAmount } = useSelector((state: RootState) => state.settings.wallpaperOverlay);
  const autoRotateHorizontal = useSelector((state: RootState) => state.settings.autoRotateHorizontal);
  
  // Determine if image is horizontal and should be rotated
  const shouldRotate = autoRotateHorizontal && imageDimensions && 
    imageDimensions.width > imageDimensions.height && 
    window.innerHeight > window.innerWidth;
  
  // Log for debugging
  useEffect(() => {
    console.log(`Wallpaper blur amount: ${blurAmount} (type: ${typeof blurAmount})`);
    console.log(`Darkness amount: ${darknessAmount} (type: ${typeof darknessAmount})`);
    console.log('Auto-rotate horizontal:', autoRotateHorizontal);
    if (imageDimensions) {
      console.log('Image dimensions:', imageDimensions);
      console.log('Should rotate:', shouldRotate);
    }
  }, [blurAmount, darknessAmount, autoRotateHorizontal, imageDimensions, shouldRotate]);

  // Handle image load
  const handleImageLoad = () => {
    setIsLoaded(true);
    setError(false);
    
    // Get image dimensions
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  };

  // Handle image error
  const handleImageError = () => {
    console.error('Failed to load wallpaper image');
    setError(true);
    setIsLoaded(false);
  };

  // Main style for the background image
  const getBackgroundStyle = () => {
    let styles: React.CSSProperties = {
      backgroundImage: `url(${wallpaper?.path || placeholderImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      transition: 'filter 0.5s ease, transform 0.5s ease',
    };
    
    // Force blur amount to a number and check if greater than 0
    const numericBlurAmount = Number(blurAmount);
    console.log(`Applying blur style, numeric value: ${numericBlurAmount}`);
    
    // Only apply blur if blurAmount is strictly greater than 0
    if (numericBlurAmount > 0) {
      styles.filter = `blur(${numericBlurAmount}px)`;
      console.log(`Applied blur filter: blur(${numericBlurAmount}px)`);
    } else {
      // Explicitly avoid blur when set to 0
      console.log('No blur applied (blur is 0 or less)');
    }
    
    // Apply darkness overlay
    if (darknessAmount > 0) {
      styles.backgroundColor = `rgba(0, 0, 0, ${darknessAmount / 100})`;
      styles.backgroundBlendMode = 'darken';
    }
    
    // Apply rotation for horizontal images if needed
    if (shouldRotate) {
      styles.transform = 'rotate(90deg) scale(1.5)';
      styles.transformOrigin = 'center center';
    }
    
    return styles;
  };
  
  // If no wallpaper is provided, show placeholder or nothing
  if (!wallpaper) {
    return (
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${placeholderImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    );
  }

  return (
    <>
      {/* Hidden image for preloading and getting dimensions */}
      <img
        ref={imageRef}
        src={wallpaper.path}
        alt="Wallpaper"
        className="sr-only"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* Actual background wallpaper */}
      <div
        className="fixed inset-0 z-0"
        style={getBackgroundStyle()}
      />
      
      {/* Darkness overlay - separate from blur for better performance */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${darknessAmount / 100})`,
        }}
      />
    </>
  );
};

export default Wallpaper; 