import { combineReducers } from '@reduxjs/toolkit';
import wallpaperReducer from './slices/wallpaperSlice';
import todoReducer from './slices/todoSlice';
import settingsReducer from './slices/settingsSlice';

const rootReducer = combineReducers({
  wallpaper: wallpaperReducer,
  todo: todoReducer,
  settings: settingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer; 