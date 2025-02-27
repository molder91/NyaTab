/**
 * Utility functions for working with arrays and objects
 */

/**
 * Shuffles an array randomly
 * @param array Array to shuffle
 * @returns New shuffled array
 */
export const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
};

/**
 * Groups an array of objects by a key
 * @param array Array to group
 * @param key Key to group by
 * @returns Object with groups
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Sorts an array of objects by a key
 * @param array Array to sort
 * @param key Key to sort by
 * @param direction Sort direction ('asc' or 'desc')
 * @returns Sorted array
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  const sortedArray = [...array];
  
  sortedArray.sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];
    
    if (valueA === valueB) {
      return 0;
    }
    
    // Handle different types
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    if (valueA === null || valueA === undefined) {
      return direction === 'asc' ? -1 : 1;
    }
    
    if (valueB === null || valueB === undefined) {
      return direction === 'asc' ? 1 : -1;
    }
    
    return direction === 'asc'
      ? (valueA < valueB ? -1 : 1)
      : (valueA < valueB ? 1 : -1);
  });
  
  return sortedArray;
};

/**
 * Filters an array of objects by a search term
 * @param array Array to filter
 * @param searchTerm Search term
 * @param keys Keys to search in
 * @returns Filtered array
 */
export const filterBySearchTerm = <T>(
  array: T[],
  searchTerm: string,
  keys: (keyof T)[]
): T[] => {
  if (!searchTerm) {
    return array;
  }
  
  const term = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key];
      
      if (value === null || value === undefined) {
        return false;
      }
      
      return String(value).toLowerCase().includes(term);
    });
  });
};

/**
 * Removes duplicates from an array
 * @param array Array with potential duplicates
 * @param key Optional key to use for comparison (for arrays of objects)
 * @returns Array without duplicates
 */
export const removeDuplicates = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Chunks an array into smaller arrays of a specified size
 * @param array Array to chunk
 * @param size Chunk size
 * @returns Array of chunks
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
};

/**
 * Flattens a nested array
 * @param array Nested array
 * @returns Flattened array
 */
export const flatten = <T>(array: Array<T | T[]>): T[] => {
  return array.reduce((result: T[], item) => {
    return Array.isArray(item) 
      ? [...result, ...flatten(item as T[])]
      : [...result, item];
  }, []);
};

/**
 * Creates an array of numbers in a range
 * @param start Start of range
 * @param end End of range
 * @param step Step between numbers
 * @returns Array of numbers
 */
export const range = (start: number, end: number, step = 1): number[] => {
  const result: number[] = [];
  
  if (step === 0) {
    return result;
  }
  
  if (start === end) {
    return [start];
  }
  
  if ((start < end && step < 0) || (start > end && step > 0)) {
    return result;
  }
  
  for (let i = start; start < end ? i <= end : i >= end; i += step) {
    result.push(i);
  }
  
  return result;
};

/**
 * Picks specified properties from an object
 * @param obj Object to pick from
 * @param keys Keys to pick
 * @returns New object with picked properties
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
};

/**
 * Omits specified properties from an object
 * @param obj Object to omit from
 * @param keys Keys to omit
 * @returns New object without omitted properties
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  
  keys.forEach(key => {
    delete result[key];
  });
  
  return result as Omit<T, K>;
}; 