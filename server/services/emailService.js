import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: `"SafetyPro" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendPermitNotification(permit, type, recipients) {
    const subject = `Permit ${type}: ${permit.permitNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SafetyPro</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Permit ${type}</h2>
          <p><strong>Permit Number:</strong> ${permit.permitNumber}</p>
          <p><strong>Work Description:</strong> ${permit.workDescription}</p>
          <p><strong>Location:</strong> ${permit.location?.area}</p>
          <p><strong>Start Date:</strong> ${new Date(permit.schedule?.startDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${permit.status}</p>
          <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please review and take appropriate action.</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/ptw/permits/${permit._id}" 
               style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Permit
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          <p>This is an automated message from SafetyPro. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    for (const recipient of recipients) {
      await this.sendEmail(recipient, subject, html);
    }
  }

  async sendIncidentNotification(incident, type, recipients) {
    const subject = `Incident ${type}: ${incident.incidentNumber}`;
    const severityColor = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SafetyPro</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Incident ${type}</h2>
          <p><strong>Incident Number:</strong> ${incident.incidentNumber}</p>
          <p><strong>Type:</strong> ${incident.type.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Severity:</strong> 
            <span style="background: ${severityColor[incident.severity]}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">
              ${incident.severity.toUpperCase()}
            </span>
          </p>
          <p><strong>Description:</strong> ${incident.description}</p>
          <p><strong>Date/Time:</strong> ${new Date(incident.dateTime).toLocaleString()}</p>
          <p><strong>Location:</strong> ${incident.location?.area}</p>
          <div style="margin: 20px 0; padding: 15px; background: #ffebee; border-left: 4px solid #f44336;">
            <p style="margin: 0;"><strong>Immediate Action Required:</strong> This incident requires immediate attention and investigation.</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/ims/incidents/${incident._id}" 
               style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Incident
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          <p>This is an automated message from SafetyPro. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    for (const recipient of recipients) {
      await this.sendEmail(recipient, subject, html);
    }
  }

  async sendReminderEmail(item, type, recipients) {
    const subject = `Reminder: ${type} - ${item.number || item.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SafetyPro</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Reminder: ${type}</h2>
          <p><strong>Item:</strong> ${item.number || item.title}</p>
          <p><strong>Due Date:</strong> ${new Date(item.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${item.status}</p>
          <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>Reminder:</strong> This item is due soon. Please take appropriate action.</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          <p>This is an automated message from SafetyPro. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    for (const recipient of recipients) {
      await this.sendEmail(recipient, subject, html);
    }
  }

  async sendWelcomeEmail(user, company) {
    const subject = 'Welcome to SafetyPro!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to SafetyPro!</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Hello ${user.name}!</h2>
          <p>Welcome to SafetyPro, your comprehensive safety management platform.</p>
          <p><strong>Company:</strong> ${company.name}</p>
          <p><strong>Your Role:</strong> ${user.role.replace('_', ' ').toUpperCase()}</p>
          <div style="margin: 20px 0; padding: 15px; background: #e8f5e8; border-left: 4px solid #4caf50;">
            <p style="margin: 0;"><strong>Getting Started:</strong> Your account has been created successfully. You can now access all the safety modules assigned to your role.</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to SafetyPro
            </a>
          </div>
          <div style="margin: 20px 0;">
            <h3>Available Modules:</h3>
            <ul>
              <li>Permit to Work (PTW)</li>
              <li>Incident Management System (IMS)</li>
              <li>HAZOP Studies</li>
              <li>HIRA Assessment</li>
              <li>Behavior Based Safety (BBS)</li>
              <li>Safety Audits</li>
            </ul>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          <p>This is an automated message from SafetyPro. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    await this.sendEmail(user.email, subject, html);
  }
}

export default new EmailService();