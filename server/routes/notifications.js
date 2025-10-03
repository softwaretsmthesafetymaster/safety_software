import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for a company
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const filter = { 
      companyId,
      $or: [
        { userId: req.user._id },
        { userId: { $exists: false } }
      ]
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const unreadCount = await Notification.countDocuments({
      ...filter,
      read: false
    });

    res.json({
      notifications,
      unreadCount,
      total: await Notification.countDocuments(filter)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create notification
router.post('/', authenticate, async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      companyId: req.user.companyId
    };

    const notification = new Notification(notificationData);
    await notification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.patch('/:companyId/:id/read', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id, 
        companyId,
        $or: [
          { userId: req.user._id },
          { userId: { $exists: false } }
        ]
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notificationId: id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.patch('/:companyId/read-all', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    await Notification.updateMany(
      { 
        companyId,
        $or: [
          { userId: req.user._id },
          { userId: { $exists: false } }
        ],
        read: false
      },
      { read: true }
    );

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      companyId,
      $or: [
        { userId: req.user._id },
        { userId: { $exists: false } }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;