/**
 * Utility functions for working with dates and times
 */

/**
 * Format options for date strings
 */
export enum DateFormat {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
  RELATIVE = 'relative'
}

/**
 * Formats a date according to the specified format
 * @param date Date to format
 * @param format Format to use
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | number | string,
  format: DateFormat = DateFormat.MEDIUM
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  const userLocale = navigator.language || 'en-US';
  
  switch (format) {
    case DateFormat.SHORT:
      return new Intl.DateTimeFormat(userLocale, {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
      }).format(dateObj);
    
    case DateFormat.MEDIUM:
      return new Intl.DateTimeFormat(userLocale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    
    case DateFormat.LONG:
      return new Intl.DateTimeFormat(userLocale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(dateObj);
    
    case DateFormat.RELATIVE:
      return formatRelativeTime(dateObj);
    
    default:
      return dateObj.toLocaleString();
  }
};

/**
 * Formats a date as a relative time string (e.g., "2 hours ago")
 * @param date Date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | number | string): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) {
    return diffSecs <= 5 ? 'just now' : `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
};

/**
 * Formats a time string (HH:MM)
 * @param date Date to format
 * @param includeSeconds Whether to include seconds
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | number | string,
  includeSeconds = false
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  const userLocale = navigator.language || 'en-US';
  
  return new Intl.DateTimeFormat(userLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true
  }).format(dateObj);
};

/**
 * Gets the start of the day for a given date
 * @param date Date to get start of day for
 * @returns Date object representing the start of the day
 */
export const startOfDay = (date: Date | number | string): Date => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : new Date(date.getTime());
  
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Gets the end of the day for a given date
 * @param date Date to get end of day for
 * @returns Date object representing the end of the day
 */
export const endOfDay = (date: Date | number | string): Date => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : new Date(date.getTime());
  
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Adds a specified number of days to a date
 * @param date Date to add days to
 * @param days Number of days to add
 * @returns New date with days added
 */
export const addDays = (
  date: Date | number | string,
  days: number
): Date => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : new Date(date.getTime());
  
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Checks if a date is today
 * @param date Date to check
 * @returns Whether the date is today
 */
export const isToday = (date: Date | number | string): boolean => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Checks if a date is in the past
 * @param date Date to check
 * @returns Whether the date is in the past
 */
export const isPast = (date: Date | number | string): boolean => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  return dateObj.getTime() < new Date().getTime();
};

/**
 * Checks if a date is in the future
 * @param date Date to check
 * @returns Whether the date is in the future
 */
export const isFuture = (date: Date | number | string): boolean => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  return dateObj.getTime() > new Date().getTime();
}; 