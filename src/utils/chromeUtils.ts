/**
 * Utility functions for working with Chrome extension APIs
 */
import { error } from './errorHandling';

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
 * Checks if the extension has the specified permissions
 * @param permissions Permissions to check
 * @returns Promise that resolves with whether the permissions are granted
 */
export const hasPermissions = (permissions: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      chrome.permissions.contains({ permissions }, (result) => {
        resolve(result);
      });
    } catch (err) {
      error('Failed to check permissions', err);
      resolve(false);
    }
  });
};

/**
 * Requests the specified permissions
 * @param permissions Permissions to request
 * @returns Promise that resolves with whether the permissions were granted
 */
export const requestPermissions = (permissions: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      chrome.permissions.request({ permissions }, (granted) => {
        resolve(granted);
      });
    } catch (err) {
      error('Failed to request permissions', err);
      resolve(false);
    }
  });
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