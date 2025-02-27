/**
 * Utility functions for handling URLs in the extension
 */

/**
 * Opens a URL in a new tab
 * @param url - The URL to open
 */
export const openUrl = (url: string): void => {
  chrome.tabs.create({ url });
};

/**
 * Checks if a string is a valid URL
 * @param str - The string to check
 * @returns True if the string is a valid URL, false otherwise
 */
export const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Extracts the domain from a URL
 * @param url - The URL to extract the domain from
 * @returns The domain of the URL
 */
export const getDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return '';
  }
};

/**
 * Checks if a URL is from a specific domain
 * @param url - The URL to check
 * @param domain - The domain to check against
 * @returns True if the URL is from the specified domain, false otherwise
 */
export const isFromDomain = (url: string, domain: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes(domain);
  } catch (e) {
    return false;
  }
};

/**
 * Sanitizes a URL to prevent XSS attacks
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export const sanitizeUrl = (url: string): string => {
  // Only allow http:, https:, and chrome-extension: protocols
  if (!url.match(/^(https?:|chrome-extension:)/i)) {
    return '';
  }
  
  return url;
};

/**
 * Gets the current tab's URL
 * @returns A promise that resolves to the current tab's URL
 */
export const getCurrentTabUrl = async (): Promise<string> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        resolve(tabs[0].url);
      } else {
        resolve('');
      }
    });
  });
};

/**
 * Opens the options page
 */
export const openOptionsPage = (): void => {
  // Using type assertion to handle the runtime API
  const runtime = chrome.runtime as any;
  if (runtime.openOptionsPage) {
    runtime.openOptionsPage();
  } else {
    // Fallback for browsers that don't support openOptionsPage
    window.open(chrome.runtime.getURL('options.html'));
  }
};

/**
 * Ensures a URL has a protocol (http:// or https://)
 * @param url URL to ensure protocol for
 * @returns URL with protocol
 */
export const ensureProtocol = (url: string): string => {
  if (!url) return '';
  
  // If the URL already has a protocol, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Otherwise, add https:// as the default protocol
  return `https://${url}`;
};

/**
 * Gets the path from a URL
 * @param url URL to get path from
 * @returns Path
 */
export const getPath = (url: string): string => {
  try {
    const urlObj = new URL(ensureProtocol(url));
    return urlObj.pathname;
  } catch (error) {
    return '';
  }
};

/**
 * Gets a query parameter from a URL
 * @param url URL to get parameter from
 * @param param Parameter name
 * @returns Parameter value
 */
export const getQueryParam = (url: string, param: string): string | null => {
  try {
    const urlObj = new URL(ensureProtocol(url));
    return urlObj.searchParams.get(param);
  } catch (error) {
    return null;
  }
};

/**
 * Builds a URL with query parameters
 * @param baseUrl Base URL
 * @param params Query parameters
 * @returns URL with query parameters
 */
export const buildUrl = (baseUrl: string, params: Record<string, string | number | boolean>): string => {
  try {
    const url = new URL(ensureProtocol(baseUrl));
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    return url.toString();
  } catch (error) {
    return baseUrl;
  }
};

/**
 * Checks if a URL is an image
 * @param url URL to check
 * @returns Whether the URL is an image
 */
export const isImageUrl = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.endsWith(ext));
};

/**
 * Gets a YouTube video ID from a URL
 * @param url YouTube URL
 * @returns YouTube video ID
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(ensureProtocol(url));
    
    // Handle youtube.com URLs
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      if (urlObj.pathname === '/watch') {
        return urlObj.searchParams.get('v');
      }
    }
    
    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.substring(1);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}; 