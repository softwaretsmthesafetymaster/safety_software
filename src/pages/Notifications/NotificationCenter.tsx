import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  Trash2,
  Filter,
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format,isValid } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount, isLoading } = useAppSelector((state) => state.notification);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchNotifications(user.companyId));
    }
  }, [dispatch, user?.companyId]);

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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'reminder':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-700';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    if (user?.companyId) {
      dispatch(markAsRead({ companyId: user.companyId, notificationId }));
    }
  };

  const handleMarkAllAsRead = () => {
    if (user?.companyId) {
      dispatch(markAllAsRead(user.companyId));
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification?.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || notification?.type === typeFilter;
    const matchesRead = !readFilter || 
                       (readFilter === 'read' && notification?.read) ||
                       (readFilter === 'unread' && !notification?.read);
    return matchesSearch && matchesType && matchesRead;
  });

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your notifications and alerts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
            <Bell className="inline h-4 w-4 mr-1" />
            {unreadCount} Unread
          </div>
          {unreadCount > 0 && (
            <Button
              variant="primary"
              icon={Check}
              onClick={handleMarkAllAsRead}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="reminder">Reminder</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>

          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bell className="mx-auto h-24 w-24 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No notifications found
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {searchTerm || typeFilter || readFilter 
                ? 'Try adjusting your search or filters.' 
                : 'You\'re all caught up! No new notifications.'}
            </p>
          </motion.div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`p-6 border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`text-lg font-semibold ${
                          !notification.read 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.type === 'success' ? 'bg-green-100 text-green-800' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          notification.type === 'error' ? 'bg-red-100 text-red-800' :
                          notification.type === 'reminder' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          {isValid(new Date(notification?.createdAt))
                                                        ? format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')
                                                        : 'Invalid Date'}
                          {/* <span>{format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}</span> */}
                        </span>
                        {notification.metadata?.type && (
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {notification.metadata.type.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Check}
                        onClick={() => handleMarkAsRead(notification._id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Trash2}
                      onClick={() => {
                        // Handle delete notification
                      }}
                    />
                  </div>
                </div>

                {/* Additional metadata */}
                {notification.metadata && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {notification.metadata.permitNumber && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Permit:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">{notification.metadata.permitNumber}</span>
                        </div>
                      )}
                      {notification.metadata.incidentNumber && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Incident:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">{notification.metadata.incidentNumber}</span>
                        </div>
                      )}
                      {notification.metadata.auditNumber && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Audit:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">{notification.metadata.auditNumber}</span>
                        </div>
                      )}
                      {notification.metadata.studyNumber && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Study:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">{notification.metadata.studyNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredNotifications.length > 0 && filteredNotifications.length < notifications.length && (
        <div className="text-center">
          <Button
            variant="secondary"
            onClick={() => {
              // Load more notifications
            }}
          >
            Load More Notifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;