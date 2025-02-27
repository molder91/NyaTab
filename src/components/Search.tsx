import React, { useState, useRef, useEffect } from 'react';
import { getMessage } from '../utils/i18n';
import { openUrl } from '../utils/urlUtils';

/**
 * Search engines supported by the component
 */
type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'yahoo';

/**
 * Search component for performing web searches
 */
const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState<SearchEngine>('google');
  const [isEngineMenuOpen, setIsEngineMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus the search input when the component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Close the engine menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsEngineMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    let searchUrl = '';
    
    switch (engine) {
      case 'google':
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'bing':
        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'duckduckgo':
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        break;
      case 'yahoo':
        searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        break;
      default:
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
    
    openUrl(searchUrl);
    setQuery('');
  };

  // Handle search engine change
  const handleEngineChange = (newEngine: SearchEngine) => {
    setEngine(newEngine);
    setIsEngineMenuOpen(false);
    
    // Focus the search input after changing the engine
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Get the search engine icon
  const getEngineIcon = () => {
    switch (engine) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
          </svg>
        );
      case 'bing':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.06 3v18l4.48-1.8 4.5 2.3 5.02-2.3V11l-5.08 1.8-3.36-1.53V5.06L5.06 3z" fill="#008373"/>
          </svg>
        );
      case 'duckduckgo':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" fill="#DE5833"/>
          </svg>
        );
      case 'yahoo':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.2 4.8h-6.4l2.96 5.44-3.36 6.16h2.32l2.48-4.8 2.48 4.8h2.32L12.64 10l2.56-5.2z" fill="#5F01D1"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg overflow-hidden">
          {/* Search engine selector */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsEngineMenuOpen(!isEngineMenuOpen)}
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={getMessage('searchEngine')}
            >
              {getEngineIcon()}
            </button>
            
            {/* Search engine dropdown */}
            {isEngineMenuOpen && (
              <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20">
                <button
                  type="button"
                  onClick={() => handleEngineChange('google')}
                  className={`flex items-center w-full px-4 py-2 text-left ${
                    engine === 'google' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleEngineChange('bing')}
                  className={`flex items-center w-full px-4 py-2 text-left ${
                    engine === 'bing' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.06 3v18l4.48-1.8 4.5 2.3 5.02-2.3V11l-5.08 1.8-3.36-1.53V5.06L5.06 3z" fill="#008373"/>
                  </svg>
                  Bing
                </button>
                <button
                  type="button"
                  onClick={() => handleEngineChange('duckduckgo')}
                  className={`flex items-center w-full px-4 py-2 text-left ${
                    engine === 'duckduckgo' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" fill="#DE5833"/>
                  </svg>
                  DuckDuckGo
                </button>
                <button
                  type="button"
                  onClick={() => handleEngineChange('yahoo')}
                  className={`flex items-center w-full px-4 py-2 text-left ${
                    engine === 'yahoo' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.2 4.8h-6.4l2.96 5.44-3.36 6.16h2.32l2.48-4.8 2.48 4.8h2.32L12.64 10l2.56-5.2z" fill="#5F01D1"/>
                  </svg>
                  Yahoo
                </button>
              </div>
            )}
          </div>
          
          {/* Search input */}
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getMessage('searchPlaceholder')}
            className="flex-grow py-3 px-4 bg-transparent border-none focus:outline-none text-gray-800 dark:text-white"
          />
          
          {/* Search button */}
          <button
            type="submit"
            className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={getMessage('search')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Search; 