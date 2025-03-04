import React from 'react';
import { Wallpaper } from '../types/wallpaper';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WallpaperDetailsProps {
  wallpaper: Wallpaper;
  onClose: () => void;
  onAddToLibrary: (wallpaper: Wallpaper) => void;
  onDownload: (wallpaper: Wallpaper, e: React.MouseEvent) => void;
  isInLibrary: boolean;
}

const WallpaperDetails: React.FC<WallpaperDetailsProps> = ({
  wallpaper,
  onClose,
  onAddToLibrary,
  onDownload,
  isInLibrary
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="flex h-full">
          {/* Image container */}
          <div className="flex-1 relative">
            <img
              src={wallpaper.path}
              alt={wallpaper.info.title}
              className="absolute inset-0 w-full h-full object-contain bg-gray-900"
            />
          </div>

          {/* Details sidebar */}
          <div className="w-96 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {wallpaper.info.title}
              </h2>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => onAddToLibrary(wallpaper)}
                  disabled={isInLibrary}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    isInLibrary
                      ? 'bg-pink-100 dark:bg-pink-900 text-pink-500'
                      : 'bg-pink-500 hover:bg-pink-600 text-white'
                  } transition-colors`}
                >
                  {isInLibrary ? (
                    <HeartIconSolid className="w-5 h-5 mr-2" />
                  ) : (
                    <HeartIcon className="w-5 h-5 mr-2" />
                  )}
                  {isInLibrary ? 'In Library' : 'Add to Library'}
                </button>

                <button
                  onClick={(e) => onDownload(wallpaper, e)}
                  className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Download
                </button>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution</h3>
                  <p className="text-gray-900 dark:text-white">{wallpaper.resolution}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</h3>
                  <a
                    href={wallpaper.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {wallpaper.info.source}
                  </a>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Date</h3>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(wallpaper.info.uploadDate).toLocaleDateString()}
                  </p>
                </div>

                {wallpaper.info.fileSize && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</h3>
                    <p className="text-gray-900 dark:text-white">
                      {Math.round(wallpaper.info.fileSize / 1024 / 1024 * 100) / 100} MB
                    </p>
                  </div>
                )}

                {wallpaper.info.tags && wallpaper.info.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {wallpaper.info.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {wallpaper.info.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {wallpaper.info.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallpaperDetails; 