/**
 * Utility functions for error handling
 */

/**
 * Log an error to the console with a custom message
 * @param message - Custom message to log with the error
 * @param error - The error object
 */
export const logError = (message: string, error: unknown): void => {
  console.error(`${message}:`, error);
  
  // If we're in development mode, log additional details
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
};

/**
 * Format an error message for display to the user
 * @param error - The error object
 * @param fallbackMessage - Fallback message if error is not an Error object
 * @returns Formatted error message
 */
export const formatErrorMessage = (error: unknown, fallbackMessage = 'An error occurred'): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallbackMessage;
};

/**
 * Create a custom error with additional data
 * @param message - Error message
 * @param code - Error code
 * @param data - Additional data
 * @returns Custom error
 */
export const createError = (message: string, code?: string, data?: Record<string, unknown>): Error => {
  const error = new Error(message);
  
  if (code) {
    (error as any).code = code;
  }
  
  if (data) {
    (error as any).data = data;
  }
  
  return error;
};

/**
 * Handle an error by logging it and returning a formatted message
 * @param error - The error object
 * @param context - Context where the error occurred
 * @param fallbackMessage - Fallback message if error is not an Error object
 * @returns Formatted error message
 */
export const handleError = (
  error: unknown, 
  context: string, 
  fallbackMessage = 'An error occurred'
): string => {
  logError(`Error in ${context}`, error);
  return formatErrorMessage(error, fallbackMessage);
}; 