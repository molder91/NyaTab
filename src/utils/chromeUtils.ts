/**
 * Utility functions for working with Chrome extension APIs
 */
import { error } from './errorHandling';
import { logError } from './errorUtils';

/**
 * Opens a URL in a new tab
 * @param url URL to open
 */
export const openInNewTab = (url: string): void => {
  try {
    chrome.tabs.create({ url });
  } catch (err) {
    error('Failed to open URL in new tab', err);
  }
};

/**
 * Gets the URL of a resource in the extension
 * @param path Path to the resource relative to the extension root
 * @returns Full URL to the resource
 */
export const getExtensionUrl = (path: string): string => {
  try {
    return chrome.runtime.getURL(path);
  } catch (err) {
    error('Failed to get extension URL', err);
    return path;
  }
};

/**
 * Sends a message to the background script
 * @param message Message to send
 * @returns Promise that resolves with the response
 */
export const sendMessageToBackground = <T = any>(message: any): Promise<T> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response as T);
        }
      });
    } catch (err) {
      error('Failed to send message to background', err);
      reject(err);
    }
  });
};

/**
 * Reloads the extension
 */
export const reloadExtension = (): void => {
  try {
    chrome.runtime.reload();
  } catch (err) {
    error('Failed to reload extension', err);
  }
};

/**
 * Gets the current active tab
 * @returns Promise that resolves with the active tab
 */
export const getActiveTab = (): Promise<chrome.tabs.Tab> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (tabs.length === 0) {
          reject(new Error('No active tab found'));
        } else {
          resolve(tabs[0]);
        }
      });
    } catch (err) {
      error('Failed to get active tab', err);
      reject(err);
    }
  });
};

/**
 * Check if the extension has the required permissions
 */
export const checkPermissions = async (permissions: chrome.permissions.Permissions): Promise<boolean> => {
  try {
    return await chrome.permissions.contains(permissions);
  } catch (error) {
    logError('Failed to check permissions', error);
    return false;
  }
};

/**
 * Request required permissions from the user
 */
export const requestPermissions = async (permissions: chrome.permissions.Permissions): Promise<boolean> => {
  try {
    return await chrome.permissions.request(permissions);
  } catch (error) {
    logError('Failed to request permissions', error);
    return false;
  }
};

/**
 * Get all granted permissions
 */
export const getGrantedPermissions = async (): Promise<chrome.permissions.Permissions> => {
  try {
    return await chrome.permissions.getAll();
  } catch (error) {
    logError('Failed to get granted permissions', error);
    return { permissions: [], origins: [] };
  }
};

/**
 * Remove granted permissions
 */
export const removePermissions = async (permissions: chrome.permissions.Permissions): Promise<boolean> => {
  try {
    return await chrome.permissions.remove(permissions);
  } catch (error) {
    logError('Failed to remove permissions', error);
    return false;
  }
};

/**
 * Check if the extension has all required permissions
 */
export const hasAllRequiredPermissions = async (requiredPermissions: chrome.permissions.Permissions): Promise<boolean> => {
  try {
    const granted = await getGrantedPermissions();
    
    // Check permissions
    if (requiredPermissions.permissions) {
      const hasAllPermissions = requiredPermissions.permissions.every(
        permission => granted.permissions?.includes(permission)
      );
      if (!hasAllPermissions) return false;
    }
    
    // Check origins
    if (requiredPermissions.origins) {
      const hasAllOrigins = requiredPermissions.origins.every(
        origin => granted.origins?.includes(origin)
      );
      if (!hasAllOrigins) return false;
    }
    
    return true;
  } catch (error) {
    logError('Failed to check all required permissions', error);
    return false;
  }
};

/**
 * Request all required permissions if not already granted
 */
export const ensurePermissions = async (requiredPermissions: chrome.permissions.Permissions): Promise<boolean> => {
  try {
    const hasPermissions = await hasAllRequiredPermissions(requiredPermissions);
    if (!hasPermissions) {
      return await requestPermissions(requiredPermissions);
    }
    return true;
  } catch (error) {
    logError('Failed to ensure permissions', error);
    return false;
  }
};

/**
 * Gets the manifest of the extension
 * @returns The manifest object
 */
export const getManifest = (): any => {
  try {
    return chrome.runtime.getManifest();
  } catch (err) {
    error('Failed to get manifest', err);
    return {};
  }
}; 