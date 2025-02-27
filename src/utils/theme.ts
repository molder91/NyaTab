/**
 * Utility functions for theme management
 */

/**
 * Theme options for the application
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Applies the specified theme to the document
 * @param theme The theme to apply ('light' or 'dark')
 */
export const applyTheme = (theme: Theme): void => {
  try {
    // Remove any existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    
    // Add the new theme class
    document.documentElement.classList.add(theme);
    
    // Set the color-scheme meta tag
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', theme);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'color-scheme';
      meta.content = theme;
      document.head.appendChild(meta);
    }
    
    console.log(`Theme applied: ${theme}`);
  } catch (error) {
    console.error('Error applying theme:', error);
  }
};

/**
 * Detects the user's preferred color scheme from system settings
 * @returns The detected theme preference ('light' or 'dark')
 */
export const detectSystemTheme = (): Theme => {
  try {
    // Check if the user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (error) {
    console.error('Error detecting system theme:', error);
    return 'light'; // Default to light theme if detection fails
  }
};

/**
 * Sets up a listener for system theme changes
 * @param callback Function to call when the theme changes
 */
export const listenForSystemThemeChanges = (callback: (theme: Theme) => void): () => void => {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Define the handler function
    const handler = (e: MediaQueryListEvent) => {
      const newTheme: Theme = e.matches ? 'dark' : 'light';
      callback(newTheme);
    };
    
    // Add the event listener
    mediaQuery.addEventListener('change', handler);
    
    // Return a function to remove the listener
    return () => mediaQuery.removeEventListener('change', handler);
  } catch (error) {
    console.error('Error setting up system theme listener:', error);
    return () => {}; // Return a no-op function if setup fails
  }
}; 