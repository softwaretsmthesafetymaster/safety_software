import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import { validatePagination, validateCompanyId, validate } from '../middleware/validation.js';
import NotificationService from '../services/notificationService.js';
import logger from '../middleware/logger.js';
import HAZOP from '../models/HAZOP.js'
const router = express.Router();

// Send notifications to team members for HAZOP
router.post('/send-team-notification', async (req, res) => {
  try {
    const { companyId, studyId, type,  } = req.body
    
      const hazop = await HAZOP.findById(studyId)
      const recipients = [hazop.chairman, hazop.scribe, ...hazop.team.map(t => t.member)]
  
    if (!companyId || !studyId || !type || !recipients) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const NotificationServiceInstance = NotificationService

    // Prepare notifications
    const notifications = recipients.map(userId => ({
      title: 'HAZOP Study Assigned',
      message: `You have been assigned to a HAZOP study. Study ID: ${studyId}`,
      type: 'info',
      userId,
      companyId,
      metadata: {
        hazopId: studyId,
        type
      },
      sendEmail: true
    }))

    await NotificationServiceInstance.createBulkNotifications(notifications)

    res.status(200).json({ message: 'Notifications sent successfully' })
  } catch (error) {
    console.error('Error sending HAZOP notifications:', error)
    res.status(500).json({ message: 'Server error' })
  }
})


// Get all notifications for a user/company
router.get('/:companyId', 
  validateCompanyId,
  validatePagination,
  validate,
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly, 
        type, 
        priority 
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true',
        type,
        priority
      };

      const result = await NotificationService.getUserNotifications(
        req.user._id,
        companyId,
        options
      );

      res.json(result);
    } catch (error) {
      logger.error('Get notifications error', { 
        error: error.message, 
        userId: req.user._id,
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create notification (admin only)
router.post('/:companyId', 
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Only certain roles can create notifications
      // if (!['company_owner', 'plant_head', 'platform_owner'].includes(req.user.role)) {
      //   return res.status(403).json({ message: 'Insufficient permissions' });
      // }

      const notificationData = {
        ...req.body,
        companyId
      };

      const notification = await NotificationService.createNotification(notificationData);

      res.status(201).json({
        message: 'Notification created successfully',
        notification
      });
    } catch (error) {
      logger.error('Create notification error', { 
        error: error.message, 
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Mark notification as read
router.patch('/:companyId/:id/read', 
  validateCompanyId,
  validate,
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const notification = await NotificationService.markAsRead(id, req.user._id);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Mark notification as read error', { 
        error: error.message, 
        notificationId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Mark all notifications as read
router.patch('/:companyId/read-all', 
  validateCompanyId,
  validate,
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;

      const result = await NotificationService.markAllAsRead(req.user._id, companyId);

      res.json({
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      logger.error('Mark all notifications as read error', { 
        error: error.message, 
        userId: req.user._id,
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Delete notification
router.delete('/:companyId/:id', 
  validateCompanyId,
  validate,
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        $or: [
          { userId: req.user._id, companyId },
          { userId: { $exists: false }, companyId }
        ]
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      logger.error('Delete notification error', { 
        error: error.message, 
        notificationId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Bulk operations for notifications
router.post('/:companyId/bulk', 
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { action, notificationIds, targetUsers, notificationData } = req.body;

      // Only certain roles can perform bulk operations
      if (!['company_owner', 'plant_head', 'platform_owner'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      let result;

      switch (action) {
        case 'markAsRead':
          if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'notification IDs required' });
          }
          
          result = await Notification.updateMany(
            {
              _id: { $in: notificationIds },
              userId: req.user._id,
              companyId
            },
            {
              read: true,
              readAt: new Date()
            }
          );
          break;

        case 'delete':
          if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'Notification IDs required' });
          }
          
          result = await Notification.deleteMany({
            _id: { $in: notificationIds },
            userId: req.user._id,
            companyId
          });
          break;

        case 'sendToUsers':
          if (!targetUsers || !notificationData) {
            return res.status(400).json({ message: 'Target users and notification data required' });
          }
          
          result = await NotificationService.notifyUsers(
            targetUsers,
            notificationData,
            companyId
          );
          break;

        case 'sendToRole':
          if (!req.body.roles || !notificationData) {
            return res.status(400).json({ message: 'Target roles and notification data required' });
          }
          
          result = await NotificationService.notifyByRole(
            companyId,
            req.body.roles,
            notificationData
          );
          break;

        default:
          return res.status(400).json({ message: 'Invalid bulk action' });
      }

      res.json({
        message: 'Bulk operation completed successfully',
        result
      });
    } catch (error) {
      logger.error('Bulk notification operation error', { 
        error: error.message, 
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;