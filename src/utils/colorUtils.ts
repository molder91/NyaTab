/**
 * Utility functions for working with colors
 */

/**
 * Converts a hex color to RGB
 * @param hex Hex color string (e.g., "#ff0000" or "#f00")
 * @returns RGB color object or null if invalid
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');
  
  // Handle shorthand hex (e.g., #f00 -> #ff0000)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Check if the hex is valid
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
};

/**
 * Converts RGB to hex
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns Hex color string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  // Ensure the values are within range
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  
  // Convert to hex
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  
  return `#${hex}`;
};

/**
 * Converts RGB to HSL
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns HSL color object
 */
export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  // Convert RGB to [0, 1] range
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    
    h /= 6;
  }
  
  // Convert to degrees, percentage, percentage
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return { h, s, l: lPercent };
};

/**
 * Converts HSL to RGB
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 * @returns RGB color object
 */
export const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  // Convert to [0, 1] range
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  // Convert to 0-255 range
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

/**
 * Generates a random color
 * @param saturation Saturation (0-100)
 * @param lightness Lightness (0-100)
 * @returns Random hex color
 */
export const randomColor = (saturation = 80, lightness = 60): string => {
  const h = Math.floor(Math.random() * 360);
  const s = Math.max(0, Math.min(100, saturation));
  const l = Math.max(0, Math.min(100, lightness));
  
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

/**
 * Calculates the contrast ratio between two colors
 * @param color1 First color (hex)
 * @param color2 Second color (hex)
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    return 1;
  }
  
  // Calculate luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }): number => {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      const val = c / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  
  // Calculate contrast ratio
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return Math.round(ratio * 100) / 100;
};

/**
 * Determines if a color is light or dark
 * @param color Color (hex)
 * @returns Whether the color is light
 */
export const isLightColor = (color: string): boolean => {
  const rgb = hexToRgb(color);
  
  if (!rgb) {
    return true;
  }
  
  // Calculate relative luminance
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

/**
 * Gets a contrasting text color (black or white) for a background color
 * @param bgColor Background color (hex)
 * @returns Text color (hex)
 */
export const getContrastingTextColor = (bgColor: string): string => {
  return isLightColor(bgColor) ? '#000000' : '#ffffff';
};

/**
 * Adjusts the brightness of a color
 * @param color Color (hex)
 * @param amount Amount to adjust (-100 to 100)
 * @returns Adjusted color (hex)
 */
export const adjustBrightness = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  
  if (!rgb) {
    return color;
  }
  
  const { r, g, b } = rgb;
  const factor = amount / 100;
  
  const adjustedR = Math.max(0, Math.min(255, r + 255 * factor));
  const adjustedG = Math.max(0, Math.min(255, g + 255 * factor));
  const adjustedB = Math.max(0, Math.min(255, b + 255 * factor));
  
  return rgbToHex(adjustedR, adjustedG, adjustedB);
}; 