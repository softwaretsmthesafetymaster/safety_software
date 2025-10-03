import Notification from '../models/Notification.js'
import emailService from './emailService.js'

class NotificationService {
  async createNotification(data) {
    try {
      const notification = new Notification(data)
      await notification.save()

      if ( data.userId) {
        const User = (await import('../models/User.js')).default
        const user = await User.findById(data.userId)
        if (user && user.email) {
          await this.sendEmailNotification(notification, user)
        }
      }
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  async createBulkNotifications(notifications) {
    try {
      const created = await Notification.insertMany(notifications)
      const User = (await import('../models/User.js')).default

      for (const n of created) {
        if ( n.userId) {
          const user = await User.findById(n.userId)
          if (user?.email) {
            await this.sendEmailNotification(n, user)
          }
        }
      }
      return created
    } catch (error) {
      console.error('Error creating bulk notifications:', error)
      throw error
    }
  }

  async sendEmailNotification(notification, user) {
    try {
      const subject = notification.title
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SafetyPro</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #333;">${notification.title}</h2>
            <p>${notification.message}</p>
            <div style="margin: 20px 0; padding: 15px; background: ${this.getNotificationColor(notification.type)}; border-radius: 5px;">
              <p style="margin: 0; color: #333;"><strong>Type:</strong> ${notification.type.toUpperCase()}</p>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View in SafetyPro
              </a>
            </div>
          </div>
          <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
            <p>This is an automated message from SafetyPro. Please do not reply to this email.</p>
          </div>
        </div>
      `
      await emailService.sendEmail(user.email, subject, html)
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  getNotificationColor(type) {
    const colors = {
      info: '#e3f2fd',
      success: '#e8f5e8',
      warning: '#fff3cd',
      error: '#ffebee',
      reminder: '#f3e5f5'
    }
    return colors[type] || colors.info
  }

  /* ------------------ Permit Notifications ------------------ */

  async notifyPermitSubmitted(permit, firstApproverId) {

    if (!firstApproverId) return
    const notification = {
      title: 'New Permit Submitted for Approval',
      message: `Permit ${permit.permitNumber} has been submitted and requires your approval.`,
      type: 'info',
      userId: firstApproverId,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_submitted'
      }
    }
    await this.createNotification(notification)
  }

  async notifyPermitPendingApproval(permit, approverId) {
    if (!approverId) return
    const notification = {
      title: 'Permit Pending Your Approval',
      message: `Permit ${permit.permitNumber} is pending your approval.`,
      type: 'info',
      userId: approverId,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_pending_approval'
      }
    }
    await this.createNotification(notification)
  }

  async notifyPermitApproved(permit) {
    const notification = {
      title: 'Permit Approved',
      message: `Your permit ${permit.permitNumber} has been approved and is now active.`,
      type: 'success',
      userId: permit.requestedBy,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_approved'
      }
    }
    await this.createNotification(notification)
  }

  async notifyPermitRejected(permit, comments) {
    const notification = {
      title: 'Permit Rejected',
      message: `Your permit ${permit.permitNumber} was rejected. Comments: ${comments || 'N/A'}`,
      type: 'error',
      userId: permit.requestedBy,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_rejected'
      }
    }
    await this.createNotification(notification)
  }

  async notifyPermitClosed(permit) {
    const notification = {
      title: 'Permit Closed',
      message: `Your permit ${permit.permitNumber} has been closed.`,
      type: 'success',
      userId: permit.requestedBy,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_closed'
      }
    }
    await this.createNotification(notification)
  }

  async notifyPermitStopped(permit) {
    const User = (await import('../models/User.js')).default
    const safetyTeam = await User.find({
      companyId: permit.companyId,
      role: { $in: ['safety_incharge', 'plant_head', 'company_owner'] },
      isActive: true
    })

    const notifications = safetyTeam.map(member => ({
      title: 'URGENT: Permit Stopped',
      message: `Permit ${permit.permitNumber} has been stopped due to safety concerns.`,
      type: 'error',
      userId: member._id,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_stopped'
      }
    }))
    await this.createBulkNotifications(notifications)
  }

  async notifyPermitExpiring(permit) {
    const User = (await import('../models/User.js')).default
    const requestedBy = await User.findById(permit.requestedBy)
    if (!requestedBy) return

    const notification = {
      title: 'Permit Expiring Soon',
      message: `Permit ${permit.permitNumber} will expire on ${new Date(
        permit.expiresAt || permit.schedule?.endDate
      ).toLocaleString()}. Please take necessary action.`,
      type: 'warning',
      userId: requestedBy._id,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_expiring'
      }
    }
    await this.createNotification(notification)

    if (requestedBy.email) {
      await emailService.sendReminderEmail(
        { number: permit.permitNumber, dueDate: permit.expiresAt || permit.schedule?.endDate, status: permit.status },
        'Permit Expiring',
        [requestedBy.email]
      )
    }
  }

  async notifyPermitExtended(permit, comments) {
    const notification = {
      title: 'Permit Extended',
      message: `Permit ${permit.permitNumber} has been extended. Comments: ${comments || ''}`,
      type: 'info',
      userId: permit.requestedBy,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_extended'
      }
    }
    await this.createNotification(notification)
  }

  async notifyPermitActivated(permit) {
    const notification = {
      title: 'Permit Activated',
      message: `Permit ${permit.permitNumber} is now active.`,
      type: 'success',
      userId: permit.requestedBy,
      companyId: permit.companyId,
      metadata: {
        permitId: permit._id,
        permitNumber: permit.permitNumber,
        type: 'permit_activated'
      }
    }
    await this.createNotification(notification)
  }
}

export default new NotificationService()
