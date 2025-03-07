/**
 * Type definitions for wallpapers
 */

/**
 * Source type for wallpapers
 */
export type WallpaperSourceType = 'local' | 'remote';

/**
 * Interface for wallpaper objects
 */
export interface WallpaperInfo {
  title: string;
  source: string;
  uploadDate: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  tags?: string[];
}

export interface Wallpaper {
  id: string;
  path: string;
  source: string;  // URL or source of the wallpaper
  sourceType: 'local' | 'remote';
  thumbnail: string;
  resolution: string;
  info: WallpaperInfo;
  addedAt?: string;
  isFavorite?: boolean;
}

/**
 * Interface for Wallhaven API wallpaper objects
 */
export interface WallhavenWallpaper {
  id: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: string;
  category: string;
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  path: string;
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
  tags: {
    id: number;
    name: string;
    alias: string;
    category_id: number;
    category: string;
    purity: string;
    created_at: string;
  }[];
}

/**
 * Interface for Wallhaven API search response
 */
export interface WallhavenSearchResponse {
  data: WallhavenWallpaper[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    query: string | null;
    seed: string | null;
  };
} 