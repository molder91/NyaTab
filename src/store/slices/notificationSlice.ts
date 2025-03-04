import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  id?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: []
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNotification: (state, action: PayloadAction<Notification>) => {
      const notification = {
        ...action.payload,
        id: action.payload.id || Date.now().toString()
      };
      state.notifications.push(notification);
    },
    hideNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const { showNotification, hideNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer; 