/**
 * Utility functions for error handling and logging
 */

/**
 * Log levels for the application
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Configuration for the logger
 */
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableStorage: false
};

/**
 * Current logger configuration
 */
let loggerConfig: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 * @param config Logger configuration
 */
export const configureLogger = (config: Partial<LoggerConfig>): void => {
  loggerConfig = { ...loggerConfig, ...config };
};

/**
 * Log a message with the specified level
 * @param level Log level
 * @param message Message to log
 * @param data Additional data to log
 */
export const log = (level: LogLevel, message: string, data?: any): void => {
  // Skip if the level is below the minimum level
  if (shouldSkipLog(level)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };

  // Log to console if enabled
  if (loggerConfig.enableConsole) {
    logToConsole(level, message, data);
  }

  // Log to storage if enabled
  if (loggerConfig.enableStorage) {
    logToStorage(logEntry);
  }
};

/**
 * Check if a log should be skipped based on its level
 * @param level Log level
 * @returns Whether the log should be skipped
 */
const shouldSkipLog = (level: LogLevel): boolean => {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const minLevelIndex = levels.indexOf(loggerConfig.minLevel);
  const currentLevelIndex = levels.indexOf(level);
  
  return currentLevelIndex < minLevelIndex;
};

/**
 * Log a message to the console
 * @param level Log level
 * @param message Message to log
 * @param data Additional data to log
 */
const logToConsole = (level: LogLevel, message: string, data?: any): void => {
  const prefix = `[NyaTab][${level}]`;
  
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(prefix, message, data);
      break;
    case LogLevel.INFO:
      console.info(prefix, message, data);
      break;
    case LogLevel.WARN:
      console.warn(prefix, message, data);
      break;
    case LogLevel.ERROR:
      console.error(prefix, message, data);
      break;
  }
};

/**
 * Log an entry to storage
 * @param logEntry Log entry to store
 */
const logToStorage = (logEntry: any): void => {
  try {
    // Get existing logs from storage
    chrome.storage.local.get(['logs'], (result) => {
      const logs = result.logs || [];
      
      // Add the new log entry
      logs.push(logEntry);
      
      // Keep only the last 100 logs
      const trimmedLogs = logs.slice(-100);
      
      // Save the logs back to storage
      chrome.storage.local.set({ logs: trimmedLogs });
    });
  } catch (error) {
    console.error('Error logging to storage:', error);
  }
};

/**
 * Log a debug message
 * @param message Message to log
 * @param data Additional data to log
 */
export const debug = (message: string, data?: any): void => {
  log(LogLevel.DEBUG, message, data);
};

/**
 * Log an info message
 * @param message Message to log
 * @param data Additional data to log
 */
export const info = (message: string, data?: any): void => {
  log(LogLevel.INFO, message, data);
};

/**
 * Log a warning message
 * @param message Message to log
 * @param data Additional data to log
 */
export const warn = (message: string, data?: any): void => {
  log(LogLevel.WARN, message, data);
};

/**
 * Log an error message
 * @param message Message to log
 * @param error Error object or additional data
 */
export const error = (message: string, error?: any): void => {
  log(LogLevel.ERROR, message, error);
};

/**
 * Get logs from storage
 * @returns Promise with the logs
 */
export const getLogs = (): Promise<any[]> => {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['logs'], (result) => {
        resolve(result.logs || []);
      });
    } catch (error) {
      console.error('Error getting logs from storage:', error);
      resolve([]);
    }
  });
};

/**
 * Clear logs from storage
 */
export const clearLogs = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove(['logs'], () => {
        resolve();
      });
    } catch (error) {
      console.error('Error clearing logs from storage:', error);
      resolve();
    }
  });
}; 