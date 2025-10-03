import Agenda from 'agenda';
import mongoose from 'mongoose';
import notificationService from './notificationService.js';
import emailService from './emailService.js';

class ReminderService {
  constructor() {
    this.agenda = new Agenda({
      db: { address: process.env.MONGODB_URI, collection: 'agendaJobs' }
    });
    
    this.defineJobs();
    this.start();
  }

  defineJobs() {
    // Permit expiry reminders
    this.agenda.define('permit expiry reminder', async (job) => {
      const { permitId } = job.attrs.data;
      const Permit = (await import('../models/Permit.js')).default;
      
      try {
        const permit = await Permit.findById(permitId)
          .populate('requestedBy', 'name email')
          .populate('companyId', 'name');
        
        if (permit && permit.status === 'active') {
          await notificationService.notifyPermitExpiring(permit);
        }
      } catch (error) {
        console.error('Error in permit expiry reminder:', error);
      }
    });

    // Incident investigation reminders
    this.agenda.define('incident investigation reminder', async (job) => {
      const { incidentId } = job.attrs.data;
      const Incident = (await import('../models/Incident.js')).default;
      const User = (await import('../models/User.js')).default;
      
      try {
        const incident = await Incident.findById(incidentId)
          .populate('investigation.assignedTo', 'name email');
        
        if (incident && incident.status === 'investigating') {
          const assignedUser = incident.investigation.assignedTo;
          if (assignedUser) {
            const notification = {
              title: 'Incident Investigation Reminder',
              message: `Investigation for incident ${incident.incidentNumber} is pending. Please complete the investigation.`,
              type: 'warning',
              userId: assignedUser._id,
              companyId: incident.companyId,
              metadata: {
                incidentId: incident._id,
                incidentNumber: incident.incidentNumber,
                type: 'investigation_reminder'
              }
            };
            
            await notificationService.createNotification(notification);
            
            if (assignedUser.email) {
              await emailService.sendReminderEmail(
                { number: incident.incidentNumber, dueDate: new Date(), status: incident.status },
                'Incident Investigation',
                [assignedUser.email]
              );
            }
          }
        }
      } catch (error) {
        console.error('Error in incident investigation reminder:', error);
      }
    });

    // HAZOP session reminders
    this.agenda.define('hazop session reminder', async (job) => {
      const { hazopId, sessionDate } = job.attrs.data;
      const HAZOP = (await import('../models/HAZOP.js')).default;
      const User = (await import('../models/User.js')).default;
      
      try {
        const hazop = await HAZOP.findById(hazopId)
          .populate('team.member', 'name email')
          .populate('facilitator', 'name email');
        
        if (hazop) {
          const attendees = [hazop.facilitator, ...hazop.team.map(t => t.member)].filter(Boolean);
          
          for (const attendee of attendees) {
            const notification = {
              title: 'HAZOP Session Reminder',
              message: `HAZOP session for study ${hazop.studyNumber} is scheduled for ${new Date(sessionDate).toLocaleString()}.`,
              type: 'reminder',
              userId: attendee._id,
              companyId: hazop.companyId,
              metadata: {
                hazopId: hazop._id,
                studyNumber: hazop.studyNumber,
                sessionDate,
                type: 'hazop_session_reminder'
              }
            };
            
            await notificationService.createNotification(notification);
            
            if (attendee.email) {
              await emailService.sendReminderEmail(
                { title: hazop.title, dueDate: sessionDate, status: 'scheduled' },
                'HAZOP Session',
                [attendee.email]
              );
            }
          }
        }
      } catch (error) {
        console.error('Error in HAZOP session reminder:', error);
      }
    });

    // Audit due reminders
    this.agenda.define('audit due reminder', async (job) => {
      const { auditId } = job.attrs.data;
      const Audit = (await import('../models/Audit.js')).default;
      
      try {
        const audit = await Audit.findById(auditId)
          .populate('auditor', 'name email')
          .populate('auditTeam.member', 'name email');
        
        if (audit && audit.status === 'planned') {
          const team = [audit.auditor, ...audit.auditTeam.map(t => t.member)].filter(Boolean);
          
          for (const member of team) {
            const notification = {
              title: 'Audit Due Reminder',
              message: `Audit ${audit.auditNumber} is scheduled for ${new Date(audit.scheduledDate).toLocaleDateString()}.`,
              type: 'reminder',
              userId: member._id,
              companyId: audit.companyId,
              metadata: {
                auditId: audit._id,
                auditNumber: audit.auditNumber,
                type: 'audit_reminder'
              }
            };
            
            await notificationService.createNotification(notification);
          }
        }
      } catch (error) {
        console.error('Error in audit due reminder:', error);
      }
    });

    // Daily safety metrics summary
    this.agenda.define('daily safety summary', async (job) => {
      const { companyId } = job.attrs.data;
      const Company = (await import('../models/Company.js')).default;
      const User = (await import('../models/User.js')).default;
      const Permit = (await import('../models/Permit.js')).default;
      const Incident = (await import('../models/Incident.js')).default;
      
      try {
        const company = await Company.findById(companyId);
        const admins = await User.find({
          companyId,
          role: { $in: ['company_owner', 'plant_head', 'safety_incharge'] },
          isActive: true
        });

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const [activePermits, newIncidents, expiredPermits] = await Promise.all([
          Permit.countDocuments({ companyId, status: 'active' }),
          Incident.countDocuments({ 
            companyId, 
            createdAt: { $gte: yesterday, $lt: today } 
          }),
          Permit.countDocuments({ 
            companyId, 
            status: 'expired',
            'schedule.endDate': { $gte: yesterday, $lt: today }
          })
        ]);

        const summary = `Daily Safety Summary:
        - Active Permits: ${activePermits}
        - New Incidents: ${newIncidents}
        - Expired Permits: ${expiredPermits}`;

        for (const admin of admins) {
          const notification = {
            title: 'Daily Safety Summary',
            message: summary,
            type: 'info',
            userId: admin._id,
            companyId,
            metadata: {
              type: 'daily_summary',
              date: today.toISOString().split('T')[0]
            }
          };
          
          await notificationService.createNotification(notification);
        }
      } catch (error) {
        console.error('Error in daily safety summary:', error);
      }
    });
  }

  async start() {
    await this.agenda.start();
    console.log('Reminder service started');
    
    // Schedule daily summaries for all companies
    await this.scheduleDailySummaries();
  }

  async scheduleDailySummaries() {
    const Company = (await import('../models/Company.js')).default;
    const companies = await Company.find({ isActive: true });
    
    for (const company of companies) {
      await this.agenda.every('0 8 * * *', 'daily safety summary', { companyId: company._id });
    }
  }

  // Schedule permit expiry reminder
  async schedulePermitExpiryReminder(permit) {
    const reminderDate = new Date(permit.schedule.endDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before expiry
    
    await this.agenda.schedule(reminderDate, 'permit expiry reminder', {
      permitId: permit._id
    });
  }

  // Schedule incident investigation reminder
  async scheduleIncidentInvestigationReminder(incident, daysFromNow = 3) {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + daysFromNow);
    
    await this.agenda.schedule(reminderDate, 'incident investigation reminder', {
      incidentId: incident._id
    });
  }

  // Schedule HAZOP session reminder
  async scheduleHAZOPSessionReminder(hazop, sessionDate) {
    const reminderDate = new Date(sessionDate);
    reminderDate.setHours(reminderDate.getHours() - 2); // 2 hours before session
    
    await this.agenda.schedule(reminderDate, 'hazop session reminder', {
      hazopId: hazop._id,
      sessionDate
    });
  }

  // Schedule audit reminder
  async scheduleAuditReminder(audit) {
    const reminderDate = new Date(audit.scheduledDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before audit
    
    await this.agenda.schedule(reminderDate, 'audit due reminder', {
      auditId: audit._id
    });
  }

  // Cancel reminders
  async cancelPermitReminders(permitId) {
    await this.agenda.cancel({ 'data.permitId': permitId });
  }

  async cancelIncidentReminders(incidentId) {
    await this.agenda.cancel({ 'data.incidentId': incidentId });
  }

  async cancelHAZOPReminders(hazopId) {
    await this.agenda.cancel({ 'data.hazopId': hazopId });
  }

  async cancelAuditReminders(auditId) {
    await this.agenda.cancel({ 'data.auditId': auditId });
  }

  async stop() {
    await this.agenda.stop();
    console.log('Reminder service stopped');
  }
}

export default new ReminderService();