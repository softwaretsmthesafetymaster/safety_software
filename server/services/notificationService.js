import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from '../middleware/logger.js';

class NotificationService {
  // Create a single notification
  async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.save();

      // Log notification creation
      logger.info('Notification created', {
        notificationId: notification._id,
        type: notification.type,
        userId: notification.userId,
        companyId: notification.companyId
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', { error: error.message, data });
      throw error;
    }
  }

  // Create multiple notifications
  async createBulkNotifications(notifications) {
    try {
      const result = await Notification.insertMany(notifications);
      
      logger.info('Bulk notifications created', {
        count: result.length,
        companyId: notifications[0]?.companyId
      });

      return result;
    } catch (error) {
      logger.error('Failed to create bulk notifications', { 
        error: error.message, 
        count: notifications.length 
      });
      throw error;
    }
  }

  // Send notification to specific users
  async notifyUsers(userIds, notificationData, companyId) {
    try {
      const notifications = userIds.map(userId => ({
        ...notificationData,
        userId,
        companyId
      }));

      return await this.createBulkNotifications(notifications);
    } catch (error) {
      logger.error('Failed to notify users', { 
        error: error.message, 
        userCount: userIds.length 
      });
      throw error;
    }
  }

  // Send notification to all users in a company
  async notifyCompany(companyId, notificationData) {
    try {
      const users = await User.find({ companyId, isActive: true }).select('_id');
      const userIds = users.map(user => user._id);

      return await this.notifyUsers(userIds, notificationData, companyId);
    } catch (error) {
      logger.error('Failed to notify company', { 
        error: error.message, 
        companyId 
      });
      throw error;
    }
  }

  // Send notification to users by role
  async notifyByRole(companyId, roles, notificationData) {
    try {
      const users = await User.find({ 
        companyId, 
        role: { $in: roles }, 
        isActive: true 
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      return await this.notifyUsers(userIds, notificationData, companyId);
    } catch (error) {
      logger.error('Failed to notify by role', { 
        error: error.message, 
        companyId, 
        roles 
      });
      throw error;
    }
  }

  // Send notification to plant users
  async notifyPlant(plantId, notificationData, companyId) {
    try {
      const users = await User.find({ 
        plantId, 
        companyId, 
        isActive: true 
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      return await this.notifyUsers(userIds, notificationData, companyId);
    } catch (error) {
      logger.error('Failed to notify plant', { 
        error: error.message, 
        plantId 
      });
      throw error;
    }
  }

  // System notifications (no specific user)
  async createSystemNotification(companyId, notificationData) {
    try {
      return await this.createNotification({
        ...notificationData,
        companyId,
        type: 'system'
      });
    } catch (error) {
      logger.error('Failed to create system notification', { 
        error: error.message, 
        companyId 
      });
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { 
          read: true, 
          readAt: new Date() 
        },
        { new: true }
      );

      if (notification) {
        logger.info('Notification marked as read', {
          notificationId,
          userId
        });
      }

      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read', { 
        error: error.message, 
        notificationId, 
        userId 
      });
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId, companyId) {
    try {
      const result = await Notification.updateMany(
        { 
          userId, 
          companyId, 
          read: false 
        },
        { 
          read: true, 
          readAt: new Date() 
        }
      );

      logger.info('All notifications marked as read', {
        userId,
        companyId,
        modifiedCount: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { 
        error: error.message, 
        userId, 
        companyId 
      });
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, companyId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false,
        type = null,
        priority = null
      } = options;

      const filter = {
        $or: [
          { userId, companyId },
          { userId: { $exists: false }, companyId }
        ]
      };

      if (unreadOnly) filter.read = false;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({
        ...filter,
        read: false
      });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      };
    } catch (error) {
      logger.error('Failed to get user notifications', { 
        error: error.message, 
        userId, 
        companyId 
      });
      throw error;
    }
  }

  // Delete old notifications
  async cleanupOldNotifications(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        read: true
      });

      logger.info('Old notifications cleaned up', {
        deletedCount: result.deletedCount,
        cutoffDate
      });

      return result;
    } catch (error) {
      logger.error('Failed to cleanup old notifications', { 
        error: error.message 
      });
      throw error;
    }
  }

  // Send limit warning notifications
  async sendLimitWarning(companyId, resourceType, current, max, threshold = 0.8) {
    if (current >= max * threshold) {
      const warningData = {
        title: `${resourceType} Limit Warning`,
        message: `You are approaching your ${resourceType} limit. Current: ${current}/${max}`,
        type: 'warning',
        priority: current >= max * 0.9 ? 'high' : 'normal',
        actionRequired: true,
        actionText: 'Upgrade Plan',
        actionUrl: '/subscription/upgrade'
      };

      await this.notifyByRole(companyId, ['company_owner'], warningData);
    }
  }
}

export default new NotificationService();