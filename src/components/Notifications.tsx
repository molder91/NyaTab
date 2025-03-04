import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { hideNotification } from '../store/slices/notificationSlice';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Notifications: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  // Auto-hide notifications after their duration (default 5 seconds)
  useEffect(() => {
    notifications.forEach(notification => {
      const duration = notification.duration || 5000; // Default 5 seconds
      const timer = setTimeout(() => {
        dispatch(hideNotification(notification.id!));
      }, duration);
      
      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'error':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/30';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/30';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      case 'warning':
        return 'border-yellow-400';
      case 'info':
      default:
        return 'border-blue-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`flex items-start p-4 mb-2 rounded-lg shadow-lg border-l-4 ${getBorderColor(notification.type)} ${getBackgroundColor(notification.type)} text-gray-800 dark:text-gray-100 animate-slide-in-right`}
          role="alert"
        >
          <div className="flex-shrink-0 mr-3">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 mr-2">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button 
            onClick={() => dispatch(hideNotification(notification.id!))}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications; 