import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
import { format, isValid } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const NotificationDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount } = useAppSelector((state) => state.notification);
  const navigate= useNavigate()
  const [isOpen, setIsOpen] = useState(false);
  const [clickLocked, setClickLocked] = useState(false); // UPDATED

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchNotifications(user.companyId));
    }
  }, [dispatch, user?.companyId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // UPDATED
  const handleNotificationClick = async (notification: any) => {
    if (clickLocked) return;

    setClickLocked(true);

    if (user?.companyId) {
      await dispatch(markAsRead({ companyId: user.companyId, notificationId: notification._id }));
    }

    if (notification?.actionUrl) {
      navigate(notification.actionUrl);
    }

    setTimeout(() => setClickLocked(false), 500);
  };

  const handleMarkAllAsRead = () => {
    if (user?.companyId) {
      dispatch(markAllAsRead(user.companyId));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-24 lg:right-0 mt-2 w-72 lg:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>

              

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)} // UPDATED
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              !notification.read
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {notification.title}
                          </p>

                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>

                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {isValid(new Date(notification?.createdAt))
                              ? format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')
                              : 'Invalid Date'}
                          </p>
                        </div>

                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to={'/notifications'}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
