/**
 * Utility functions for internationalization (i18n)
 */

/**
 * Gets a localized message from the messages.json file
 * @param messageName The name of the message in messages.json
 * @param substitutions Optional substitutions for placeholders in the message
 * @returns The localized message string
 */
export const getMessage = (messageName: string, substitutions?: string | string[]): string => {
  try {
    return chrome.i18n.getMessage(messageName, substitutions) || messageName;
  } catch (error) {
    console.error(`Error getting message for ${messageName}:`, error);
    return messageName;
  }
};

/**
 * Gets the user's preferred language
 * @returns Promise with the user's preferred language
 */
export const getUserLanguage = async (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      chrome.i18n.getAcceptLanguages((languages) => {
        if (languages && languages.length > 0) {
          // Get the first preferred language
          resolve(languages[0]);
        } else {
          // Default to English if no language preference is found
          resolve('en');
        }
      });
    } catch (error) {
      console.error('Error getting user language:', error);
      resolve('en');
    }
  });
};

/**
 * Formats a date according to the user's locale
 * @param date The date to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | number,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  try {
    // Get the user's language or default to English
    const userLanguage = navigator.language || 'en-US';
    
    // Format the date according to the user's locale
    return new Intl.DateTimeFormat(userLanguage, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateObj.toDateString();
  }
};

/**
 * Formats a number according to the user's locale
 * @param number The number to format
 * @param options Formatting options
 * @returns Formatted number string
 */
export const formatNumber = (
  number: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  try {
    // Get the user's language or default to English
    const userLanguage = navigator.language || 'en-US';
    
    // Format the number according to the user's locale
    return new Intl.NumberFormat(userLanguage, options).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return number.toString();
  }
}; 