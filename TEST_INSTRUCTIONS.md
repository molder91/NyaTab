# NyaTab Testing Instructions

This document provides step-by-step instructions for loading and testing the NyaTab Chrome extension.

## Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top-right corner
3. Click "Load unpacked" and select the `dist` folder from this project
4. The NyaTab extension should now be installed and visible in your extensions list

## Testing Basic Functionality

### New Tab Page
- Open a new tab to see the NyaTab new tab page
- Verify that a wallpaper is loaded
- Check that the clock displays the correct time
- Test the search functionality
- Verify that the Todo component works correctly

### Settings Page
- Click the extension icon in the toolbar and select "Settings"
- OR right-click the extension icon and select "Options"
- Test changing the theme between light, dark, and system
- Adjust wallpaper settings such as refresh interval and filters
- Verify that settings are saved correctly

### Popup
- Click the extension icon in the toolbar
- Verify that the popup opens correctly
- Test the links to Settings and New Tab

## Testing Background Features

- Wait for the refresh interval to trigger a wallpaper change
- OR manually refresh the wallpaper using the refresh button
- Verify that alarms are working correctly

## Known Issues

- Empty icon files (will be replaced with proper icons in future updates)

## Reporting Issues

If you encounter any issues during testing, please document them with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if applicable) 