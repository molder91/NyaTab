# NyaTab

A beautiful new tab page Chrome extension with customizable wallpapers and productivity features.

## Features

- **Beautiful Wallpapers**: Automatically fetches high-quality wallpapers from Wallhaven
- **Todo List**: Built-in todo list to keep track of your tasks
- **Clock & Date**: Displays current time and date
- **Search Bar**: Quick access to search with multiple search engines
- **Theme Support**: Light, dark, and system theme options
- **Customization**: Configure wallpaper categories, refresh intervals, and more

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link will be updated when published)
2. Click "Add to Chrome"
3. Confirm the installation

### From Source

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/nyatab.git
   ```

2. Install dependencies:
   ```
   cd nyatab
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the `dist` folder from the project directory

## Development

### Setup

1. Clone the repository and install dependencies as described above
2. Start the development server:
   ```
   npm start
   ```
3. Load the extension in Chrome as described above

The development server will watch for changes and automatically rebuild the extension. You'll need to refresh the extension in Chrome to see your changes.

### Project Structure

- `src/`: Source code
  - `components/`: React components
  - `services/`: Service modules for data operations
  - `store/`: Redux store and slices
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions
  - `background.ts`: Background script
  - `newtab.tsx`: New tab page entry point
  - `popup.tsx`: Popup page entry point
  - `options.tsx`: Options page entry point
- `public/`: Static assets
  - `_locales/`: Internationalization files
  - `manifest.json`: Extension manifest
  - `icons/`: Extension icons

### Commands

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Run ESLint and fix issues
- `npm run test`: Run tests
- `npm run type-check`: Run TypeScript type checking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Wallhaven](https://wallhaven.cc/) for providing the wallpaper API
- [React](https://reactjs.org/) for the UI library
- [Redux](https://redux.js.org/) for state management
- [Tailwind CSS](https://tailwindcss.com/) for styling # NyaTab
