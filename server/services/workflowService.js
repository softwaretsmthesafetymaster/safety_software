import Company from '../models/Company.js';
import User from '../models/User.js';
import notificationService from './notificationService.js';
import reminderService from './reminderService.js';

class WorkflowService {
  // Get workflow configuration for a module
  static async getWorkflowConfig(companyId, module) {
    try {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      return company.config?.modules?.[module]?.flows || {};
    } catch (error) {
      console.error('Error getting workflow config:', error);
      return {};
    }
  }

  // Process PTW workflow
  static async processPTWWorkflow(permit, action, userId) {
    try {
      const config = await this.getWorkflowConfig(permit.companyId, 'ptw');
      
      switch (action) {
        case 'submit':
          return await this.handlePTWSubmission(permit, config);
        case 'approve':
          return await this.handlePTWApproval(permit, config, userId);
        case 'activate':
          return await this.handlePTWActivation(permit, config);
        case 'close':
          return await this.handlePTWClosure(permit, config);
        case 'expire':
          return await this.handlePTWExpiry(permit, config);
        default:
          throw new Error('Invalid PTW workflow action');
      }
    } catch (error) {
      console.error('Error processing PTW workflow:', error);
      throw error;
    }
  }

  static async handlePTWSubmission(permit, config) {
    permit.status = 'submitted';
    
    // Set first approval step as pending
    if (permit.approvals && permit.approvals.length > 0) {
      permit.approvals[0].status = 'pending';
    }

    // Send notifications to approvers
    const approvers = await User.find({
      companyId: permit.companyId,
      role: { $in: config.approval?.steps?.map(s => s.role) || ['safety_incharge', 'plant_head'] },
      isActive: true
    });

    for (const approver of approvers) {
      await notificationService.notifyPermitSubmitted(permit, approver);
    }

    // Schedule approval reminder
    const reminderTime = config.approval?.reminderHours || 24;
    await reminderService.schedulePermitApprovalReminder(permit, reminderTime);

    return permit;
  }

  static async handlePTWApproval(permit, config, approverId) {
    const currentApproval = permit.approvals.find(app => app.status === 'pending');
    if (!currentApproval) {
      throw new Error('No pending approval found');
    }

    currentApproval.approver = approverId;
    currentApproval.status = 'approved';
    currentApproval.timestamp = new Date();

    // Check if there's a next approval step
    const nextStep = permit.approvals.find(a => a.step === currentApproval.step + 1);
    if (nextStep) {
      nextStep.status = 'pending';
      // Notify next approver
    } else {
      // All approvals complete
      permit.status = 'approved';
      await notificationService.notifyPermitApproved(permit);
    }

    return permit;
  }

  static async handlePTWActivation(permit, config) {
    permit.status = 'active';
    
    // Schedule expiry reminder
    const reminderDays = config.expiry?.reminderDays || [1];
    for (const days of reminderDays) {
      await reminderService.schedulePermitExpiryReminder(permit, days);
    }

    return permit;
  }

  static async handlePTWClosure(permit, config) {
    permit.status = 'closed';
    
    // Cancel any pending reminders
    await reminderService.cancelPermitReminders(permit._id);

    return permit;
  }

  static async handlePTWExpiry(permit, config) {
    permit.status = 'expired';
    
    // Notify permit holder
    await notificationService.notifyPermitExpired(permit);

    return permit;
  }

  // Process IMS workflow
  static async processIMSWorkflow(incident, action, userId, data = {}) {
    try {
      const config = await this.getWorkflowConfig(incident.companyId, 'ims');
      
      switch (action) {
        case 'assign':
          return await this.handleIMSAssignment(incident, config, userId, data);
        case 'investigate':
          return await this.handleIMSInvestigation(incident, config, data);
        case 'actions':
          return await this.handleIMSActions(incident, config, data);
        case 'close':
          return await this.handleIMSClosure(incident, config);
        default:
          throw new Error('Invalid IMS workflow action');
      }
    } catch (error) {
      console.error('Error processing IMS workflow:', error);
      throw error;
    }
  }

  static async handleIMSAssignment(incident, config, assignedTo, data) {
    incident.investigation = {
      ...incident.investigation,
      assignedTo,
      team: data.team || []
    };
    incident.status = 'investigating';

    // Notify assigned investigator
    await notificationService.notifyIncidentAssigned(incident, assignedTo);

    // Schedule investigation reminder
    const timeLimit = config.investigation?.timeLimit || 72;
    await reminderService.scheduleIncidentInvestigationReminder(incident, timeLimit);

    return incident;
  }

  static async handleIMSInvestigation(incident, config, data) {
    incident.investigation = {
      ...incident.investigation,
      ...data
    };

    // Auto-assign actions if configured
    if (config.actions?.autoAssign) {
      incident.status = 'pending_closure';
    }

    return incident;
  }

  static async handleIMSActions(incident, config, data) {
    incident.correctiveActions = data.actions;
    incident.status = 'pending_closure';

    // Notify action assignees
    for (const action of data.actions) {
      if (action.assignedTo) {
        await notificationService.notifyActionAssigned(incident, action);
      }
    }

    return incident;
  }

  static async handleIMSClosure(incident, config) {
    incident.status = 'closed';
    
    // Cancel any pending reminders
    await reminderService.cancelIncidentReminders(incident._id);

    return incident;
  }

  // Process HAZOP workflow
  static async processHAZOPWorkflow(study, action, userId, data = {}) {
    try {
      const config = await this.getWorkflowConfig(study.companyId, 'hazop');
      
      switch (action) {
        case 'start':
          return await this.handleHAZOPStart(study, config);
        case 'session':
          return await this.handleHAZOPSession(study, config, data);
        case 'complete':
          return await this.handleHAZOPCompletion(study, config);
        case 'close':
          return await this.handleHAZOPClosure(study, config);
        default:
          throw new Error('Invalid HAZOP workflow action');
      }
    } catch (error) {
      console.error('Error processing HAZOP workflow:', error);
      throw error;
    }
  }

  static async handleHAZOPStart(study, config) {
    study.status = 'in_progress';
    
    // Notify team members
    const team = await User.find({
      _id: { $in: study.team.map(t => t.member) }
    });

    for (const member of team) {
      await notificationService.notifyHAZOPStarted(study, member);
    }

    return study;
  }

  static async handleHAZOPSession(study, config, data) {
    study.sessions.push({
      date: data.date,
      duration: data.duration,
      attendees: data.attendees,
      nodesReviewed: data.nodesReviewed,
      notes: data.notes,
      nextSession: data.nextSession
    });

    // Schedule next session reminder if applicable
    if (data.nextSession) {
      await reminderService.scheduleHAZOPSessionReminder(study, data.nextSession);
    }

    return study;
  }

  static async handleHAZOPCompletion(study, config) {
    study.status = 'completed';
    study.completionDate = new Date();
    
    // Check if all nodes are complete
    const allNodesComplete = study.nodes.every(node => 
      node.worksheets.every(ws => ws.recommendations.length > 0)
    );

    if (!allNodesComplete && config.closure?.requireAllNodesComplete) {
      throw new Error('All nodes must be completed before closing the study');
    }

    return study;
  }

  static async handleHAZOPClosure(study, config) {
    study.status = 'closed';
    
    // Cancel any pending reminders
    await reminderService.cancelHAZOPReminders(study._id);

    return study;
  }

  // Process HIRA workflow
  static async processHIRAWorkflow(assessment, action, userId, data = {}) {
    try {
      const config = await this.getWorkflowConfig(assessment.companyId, 'hira');
      
      switch (action) {
        case 'review':
          return await this.handleHIRAReview(assessment, config);
        case 'approve':
          return await this.handleHIRAApproval(assessment, config, userId);
        case 'close':
          return await this.handleHIRAClosure(assessment, config);
        default:
          throw new Error('Invalid HIRA workflow action');
      }
    } catch (error) {
      console.error('Error processing HIRA workflow:', error);
      throw error;
    }
  }

  static async handleHIRAReview(assessment, config) {
    assessment.status = 'in_progress';
    
    // Schedule review reminder
    const reviewTime = config.flows?.worksheet?.reviewTime || 168;
    await reminderService.scheduleHIRAReviewReminder(assessment, reviewTime);

    return assessment;
  }

  static async handleHIRAApproval(assessment, config, approverId) {
    assessment.status = 'approved';
    
    // Notify assessor
    await notificationService.notifyHIRAApproved(assessment);

    return assessment;
  }

  static async handleHIRAClosure(assessment, config) {
    assessment.status = 'closed';
    
    // Cancel any pending reminders
    await reminderService.cancelHIRAReminders(assessment._id);

    return assessment;
  }

  // Process BBS workflow
  static async processBBSWorkflow(report, action, userId, data = {}) {
    try {
      const config = await this.getWorkflowConfig(report.companyId, 'bbs');
      
      switch (action) {
        case 'review':
          return await this.handleBBSReview(report, config, userId);
        case 'close':
          return await this.handleBBSClosure(report, config);
        default:
          throw new Error('Invalid BBS workflow action');
      }
    } catch (error) {
      console.error('Error processing BBS workflow:', error);
      throw error;
    }
  }

  static async handleBBSReview(report, config, reviewerId) {
    // Auto-assign if configured
    if (config.review?.autoAssign) {
      const reviewers = await User.find({
        companyId: report.companyId,
        role: { $in: config.review.roles || ['safety_incharge'] },
        isActive: true
      });

      if (reviewers.length > 0) {
        const assignedReviewer = reviewers[0];
        await notificationService.notifyBBSReviewAssigned(report, assignedReviewer);
      }
    }

    return report;
  }

  static async handleBBSClosure(report, config) {
    report.status = 'closed';
    
    // Cancel any pending reminders
    await reminderService.cancelBBSReminders(report._id);

    return report;
  }

  // Process Audit workflow
  static async processAuditWorkflow(audit, action, userId, data = {}) {
    try {
      const config = await this.getWorkflowConfig(audit.companyId, 'audit');
      
      switch (action) {
        case 'start':
          return await this.handleAuditStart(audit, config);
        case 'complete':
          return await this.handleAuditCompletion(audit, config);
        case 'close':
          return await this.handleAuditClosure(audit, config);
        default:
          throw new Error('Invalid Audit workflow action');
      }
    } catch (error) {
      console.error('Error processing Audit workflow:', error);
      throw error;
    }
  }

  static async handleAuditStart(audit, config) {
    audit.status = 'in_progress';
    audit.actualDate = new Date();
    
    // Notify audit team
    const team = await User.find({
      _id: { $in: [audit.auditor, ...audit.auditTeam.map(t => t.member)] }
    });

    for (const member of team) {
      await notificationService.notifyAuditStarted(audit, member);
    }

    return audit;
  }

  static async handleAuditCompletion(audit, config) {
    audit.status = 'completed';
    
    // Auto-assign corrective actions if configured
    if (config.closure?.autoAssign && audit.findings) {
      for (const finding of audit.findings) {
        if (finding.correctiveAction && finding.correctiveAction.assignedTo) {
          await notificationService.notifyActionAssigned(audit, finding.correctiveAction);
        }
      }
    }

    return audit;
  }

  static async handleAuditClosure(audit, config) {
    audit.status = 'closed';
    
    // Cancel any pending reminders
    await reminderService.cancelAuditReminders(audit._id);

    return audit;
  }

  // Check if user has permission for workflow action
  static async checkWorkflowPermission(companyId, module, action, userRole) {
    try {
      const config = await this.getWorkflowConfig(companyId, module);
      const actionConfig = config[action];
      
      if (!actionConfig || !actionConfig.roles) {
        return true; // Default allow if no specific config
      }

      return actionConfig.roles.includes(userRole);
    } catch (error) {
      console.error('Error checking workflow permission:', error);
      return false;
    }
  }

  // Get SLA configuration
  static async getSLAConfig(companyId, module) {
    try {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      return company.config?.sla?.[module] || {};
    } catch (error) {
      console.error('Error getting SLA config:', error);
      return {};
    }
  }

  // Check SLA compliance
  static async checkSLACompliance(companyId, module, item, action) {
    try {
      const slaConfig = await this.getSLAConfig(companyId, module);
      const timeLimit = slaConfig[action] || 0;
      
      if (!timeLimit) return { compliant: true, overdue: false };

      const createdAt = new Date(item.createdAt);
      const now = new Date();
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

      return {
        compliant: hoursElapsed <= timeLimit,
        overdue: hoursElapsed > timeLimit,
        hoursElapsed: Math.round(hoursElapsed),
        timeLimit
      };
    } catch (error) {
      console.error('Error checking SLA compliance:', error);
      return { compliant: true, overdue: false };
    }
  }
}

export default WorkflowService;