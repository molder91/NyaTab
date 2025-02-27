import React, { ReactNode, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { applyTheme, listenForSystemThemeChanges } from '../utils/theme';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout component for structuring pages
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useAppSelector(state => state.settings);

  // Apply theme when component mounts or theme changes
  useEffect(() => {
    applyTheme(theme);
    
    // Listen for system theme changes if using system theme
    const cleanup = listenForSystemThemeChanges((newTheme) => {
      if (theme === newTheme) {
        applyTheme(newTheme);
      }
    });
    
    return cleanup;
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {children}
    </div>
  );
};

export default Layout; 