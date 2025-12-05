import Notification from '../models/Notification.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv'
dotenv.config()
class NotificationService {
  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      
      // Send email if enabled
      if (data.channels?.email) {
        await this.sendEmail(notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async notifyPermitSubmitted(permit, approver) {
    try {
      if (!approver) return;

      const notification = await this.createNotification({
        title: 'Permit Submitted for Approval',
        message: `Permit ${permit.permitNumber} has been submitted and requires your approval.`,
        type: 'info',
        priority: 'high',
        userId: approver,
        companyId: permit.companyId,
        plantId: permit.plantId,
        metadata: {
          permitId: permit._id,
          permitNumber: permit.permitNumber,
          workDescription: permit.workDescription
        },
        actionRequired: true,
        actionUrl: `/ptw/permits/${permit._id}/approve`,
        actionText: 'Review & Approve',
        channels: {
          email: true,
          push: true,
          inApp: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying permit submission:', error);
    }
  }

  async notifyPermitApproved(permit) {
    try {
      const notification = await this.createNotification({
        title: 'Permit Approved',
        message: `Permit ${permit.permitNumber} has been approved and is ready for activation.`,
        type: 'success',
        priority: 'normal',
        userId: permit.requestedBy,
        companyId: permit.companyId,
        plantId: permit.plantId,
        metadata: {
          permitId: permit._id,
          permitNumber: permit.permitNumber
        },
        actionRequired: true,
        actionUrl: `/ptw/permits/${permit._id}/activate`,
        actionText: 'Activate Permit',
        channels: {
          email: true,
          push: true,
          inApp: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying permit approval:', error);
    }
  }

  async notifyPermitRejected(permit, comments) {
    try {
      const notification = await this.createNotification({
        title: 'Permit Rejected',
        message: `Permit ${permit.permitNumber} has been rejected. Comments: ${comments}`,
        type: 'error',
        priority: 'high',
        userId: permit.requestedBy,
        companyId: permit.companyId,
        plantId: permit.plantId,
        metadata: {
          permitId: permit._id,
          permitNumber: permit.permitNumber,
          rejectionComments: comments
        },
        actionRequired: true,
        actionUrl: `/ptw/permits/${permit._id}/edit`,
        actionText: 'Review & Resubmit',
        channels: {
          email: true,
          push: true,
          inApp: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying permit rejection:', error);
    }
  }

  async notifyPermitActivated(permit) {
    try {
      const notification = await this.createNotification({
        title: 'Permit Activated',
        message: `Permit ${permit.permitNumber} is now active. Work can commence.`,
        type: 'success',
        priority: 'normal',
        userId: permit.requestedBy,
        companyId: permit.companyId,
        plantId: permit.plantId,
        metadata: {
          permitId: permit._id,
          permitNumber: permit.permitNumber,
          activatedAt: new Date()
        },
        channels: {
          email: true,
          push: true,
          inApp: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying permit activation:', error);
    }
  }

  async notifyPermitExpiring(permit) {
    try {
      const notification = await this.createNotification({
        title: 'Permit Expiring Soon',
        message: `Permit ${permit.permitNumber} will expire soon. Please complete work or request extension.`,
        type: 'warning',
        priority: 'high',
        userId: permit.requestedBy,
        companyId: permit.companyId,
        plantId: permit.plantId,
        metadata: {
          permitId: permit._id,
          permitNumber: permit.permitNumber,
          expiresAt: permit.expiresAt
        },
        actionRequired: true,
        actionUrl: `/ptw/permits/${permit._id}/extend`,
        actionText: 'Request Extension',
        channels: {
          email: true,
          push: true,
          inApp: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying permit expiring:', error);
    }
  }

  async notifyPermitStopped(permit) {
    try {
      // Notify multiple stakeholders
      const stakeholders = [permit.requestedBy];
      if (permit.approvals) {
        stakeholders.push(...permit.approvals.map(a => a.approver).filter(Boolean));
      }

      const notifications = await Promise.all(
        stakeholders.map(userId => 
          this.createNotification({
            title: 'Work Permit Stopped',
            message: `URGENT: Permit ${permit.permitNumber} has been stopped due to safety concerns.`,
            type: 'error',
            priority: 'urgent',
            userId,
            companyId: permit.companyId,
            plantId: permit.plantId,
            metadata: {
              permitId: permit._id,
              permitNumber: permit.permitNumber,
              stopReason: permit.stopDetails?.stopReason
            },
            actionRequired: true,
            actionUrl: `/ptw/permits/${permit._id}`,
            actionText: 'View Details',
            channels: {
              email: true,
              sms: true,
              push: true,
              inApp: true
            }
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error notifying permit stop:', error);
    }
  }

  async notifyPermitClosed(permit) {
    try {
      const notification = await this.createNotification({
        title: 'Permit Closed',
        message: `Permit ${permit.permitNumber} has been closed successfully.`,
        type: 'success',
        priority: 'normal',
        userId: permit.requestedBy,
        companyId: permit.companyId,
        plantId: permit.plantId,
        metadata: {
          permitId: permit._id,
          permitNumber: permit.permitNumber,
          closedAt: new Date()
        },
        channels: {
          email: true,
          push: true,
          inApp: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying permit closure:', error);
    }
  }

  async notifyPermitExtended(permit, comments) {
    try {
      const notification = await this.createNotification({
        title: 'Permit Extended',
        message: `Permit ${permit.permitNumber} has been extended. New expiry: ${permit.expiresAt}`,
        type: 'info',
        priority: 'normal',
        userId: permit.requestedBy,
        companyId: permit.companyId,
        plantId: permit.plantId,
        metadata: {
          permitId: permit._id,
          permitNumber: permit.permitNumber,
          newExpiryDate: permit.expiresAt,
          extensionComments: comments
        },
        channels: {
          email: true,
          push: true,
          inApp: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying permit extension:', error);
    }
  }

  async sendEmail(notification) {
    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.email) return;

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: user.email,
        subject: notification.title,
        html: this.generateEmailTemplate(notification, user)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      // Update delivery status
      await Notification.findByIdAndUpdate(notification._id, {
        'deliveryStatus.email.sent': true,
        'deliveryStatus.email.sentAt': new Date()
      });

      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update delivery status with error
      await Notification.findByIdAndUpdate(notification._id, {
        'deliveryStatus.email.sent': false,
        'deliveryStatus.email.error': error.message,
        'deliveryStatus.email.sentAt': new Date()
      });
      
      throw error;
    }
  }

  generateEmailTemplate(notification, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
          .priority-urgent { border-left: 5px solid #ef4444; }
          .priority-high { border-left: 5px solid #f59e0b; }
          .priority-normal { border-left: 5px solid #3b82f6; }
          .priority-low { border-left: 5px solid #6b7280; }
          .action-button { 
            display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          <div class="content priority-${notification.priority}">
            <p>Dear ${user.name},</p>
            <p>${notification.message}</p>
            
            ${notification.metadata ? `
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h3>Details:</h3>
                ${notification.metadata.permitNumber ? `<p><strong>Permit Number:</strong> ${notification.metadata.permitNumber}</p>` : ''}
                ${notification.metadata.workDescription ? `<p><strong>Work Description:</strong> ${notification.metadata.workDescription}</p>` : ''}
                ${notification.metadata.expiresAt ? `<p><strong>Expires At:</strong> ${new Date(notification.metadata.expiresAt).toLocaleString()}</p>` : ''}
              </div>
            ` : ''}
            
            ${notification.actionUrl ? `
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${notification.actionUrl}" class="action-button">
                ${notification.actionText || 'View Details'}
              </a>
            ` : ''}
            
            <p>Best regards,<br>Safety Management System</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new NotificationService();