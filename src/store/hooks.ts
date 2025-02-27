import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Custom hook for accessing the Redux dispatch function with proper typing
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Custom hook for accessing the Redux store state with proper typing
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 