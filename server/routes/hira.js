import express from 'express';
import HIRA from '../models/HIRA.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { scheduleHiraReminder, scheduleApprovalReminder, cancelJob } from '../config/agenda.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from 'docx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';

const router = express.Router();

// Initialize Gemini AI
const modelName = 'gemini-2.0-flash-exp';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper to create notifications
const createNotification = async (userId, title, body, type, meta = {}) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      body,
      type,
      meta,
      'meta.priority': ['hira_assigned', 'hira_rejected', 'hira_reminder', 'hira_submitted'].includes(type) ? 'high' : 'medium',
    });
    await notification.save();
  } catch (err) {
    console.error(`Error creating notification for user ${userId}:`, err.message);
  }
};

// GET: Dashboard statistics
router.get('/:companyId/dashboard', authenticate, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period = 'month', plantId } = req.query;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    // 🧩 Extract logged-in user info
    const user = req.user;

    // 1️⃣ Determine time range
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // 2️⃣ Build base match query for company & date
    let baseMatch = {
      companyId: companyObjectId,
      createdAt: { $gte: startDate },
    };

    // 3️⃣ Apply role-based filters
    if (user.role === 'superadmin') {
      // ✅ Superadmin → see all company data
      // no extra filters
    } else if (user.role === 'admin') {
      // ✅ Admin → only plant-level data
      baseMatch.plantId = new mongoose.Types.ObjectId(user.plant);
    } else if (['user', 'hod', 'safety_incharge'].includes(user.role)) {
      // ✅ Users / HOD / Safety → see only their own or assigned/team data
      baseMatch.$or = [
        { createdBy: user._id },
        { assessor: user._id },
        { team: user._id }, // if you have teamMembers array
        { assignedTo: user._id }   // if assignments are tracked like this
      ];
    } else if (user.role === 'assessor') {
      // ✅ Assessor → only assigned assessments
      baseMatch.assessor = user._id;
    }

    // 4️⃣ Apply optional plant filter (from frontend dropdown)
    if (plantId && plantId !== 'all') {
      baseMatch.plantId = new mongoose.Types.ObjectId(plantId);
    }

    // 5️⃣ Aggregations in parallel (unchanged)
    const [
      totalAssessments,
      assignedAssessments,
      inProgressAssessments,
      completedAssessments,
      approvedAssessments,
      closedAssessments,
      actionsSummary,
      highRiskItems,
      riskDistribution,
      riskTrend,
      recentAssessments,
      statusDistribution,
      avgClosureTime,
      plantSummary,
      assessorPerformance,
      hazardFrequency,
      significanceSummary
    ] = await Promise.all([
      HIRA.countDocuments(baseMatch),
      HIRA.aggregate([{ $match: { ...baseMatch, status: 'assigned' } }, { $count: 'count' }]).then(r => r[0]?.count || 0),
      HIRA.aggregate([{ $match: { ...baseMatch, status: 'in_progress' } }, { $count: 'count' }]).then(r => r[0]?.count || 0),
      HIRA.aggregate([{ $match: { ...baseMatch, status: 'completed' } }, { $count: 'count' }]).then(r => r[0]?.count || 0),
      HIRA.aggregate([{ $match: { ...baseMatch, status: 'approved' } }, { $count: 'count' }]).then(r => r[0]?.count || 0),
      HIRA.aggregate([{ $match: { ...baseMatch, status: 'closed' } }, { $count: 'count' }]).then(r => r[0]?.count || 0),

      // 🟡 Actions Summary
      HIRA.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalActions: { $sum: '$actionsSummary.totalActions' },
            openActions: { $sum: '$actionsSummary.openActions' },
            inProgressActions: { $sum: '$actionsSummary.inProgressActions' },
            completedActions: { $sum: '$actionsSummary.completedActions' },
            overdueActions: { $sum: '$actionsSummary.overdueActions' },
          },
        },
      ]).then(r => r[0] || {
        totalActions: 0, openActions: 0, inProgressActions: 0, completedActions: 0, overdueActions: 0
      }),

      // 🟡 High Risk Items
      HIRA.aggregate([
        { $match: baseMatch },
        { $unwind: '$worksheetRows' },
        { $match: { 'worksheetRows.riskCategory': { $in: ['High', 'Very High'] } } },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0),

      // 🟡 Risk Distribution
      HIRA.aggregate([
        { $match: baseMatch },
        { $unwind: '$worksheetRows' },
        {
          $group: {
            _id: '$worksheetRows.riskCategory',
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, name: '$_id', count: 1 } },
        { $sort: { count: -1 } }
      ]),

      // 🟡 Risk Trend
      HIRA.aggregate([
        { $match: baseMatch },
        { $unwind: '$worksheetRows' },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              risk: '$worksheetRows.riskCategory'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // 🟡 Recent Assessments
      HIRA.find(baseMatch)
        .populate('assessor', 'name')
        .populate('plantId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),

      // 🟡 Status Distribution
      HIRA.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { name: '$_id', count: 1, _id: 0 } }
      ]),

      // 🟡 Average Closure Time
      HIRA.aggregate([
        { $match: { ...baseMatch, closedAt: { $exists: true } } },
        {
          $project: {
            duration: {
              $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 1000 * 60 * 60 * 24]
            }
          }
        },
        { $group: { _id: null, avgDays: { $avg: '$duration' } } }
      ]).then(r => r[0]?.avgDays?.toFixed(1) || 0),

      // 🟡 Plant Summary
      HIRA.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$plantId',
            total: { $sum: 1 },
            highRisks: { $sum: { $cond: [{ $gte: ['$riskSummary.highRiskCount', 1] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
          },
        },
        {
          $lookup: {
            from: 'plants',
            localField: '_id',
            foreignField: '_id',
            as: 'plant'
          }
        },
        { $unwind: '$plant' },
        { $project: { plantName: '$plant.name', total: 1, closed: 1, highRisks: 1 } }
      ]),

      // 🟡 Assessor Performance
      HIRA.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$assessor',
            totalAssessments: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            assessor: '$user.name',
            totalAssessments: 1,
            completed: 1,
            completionRate: {
              $round: [{ $multiply: [{ $divide: ['$completed', '$totalAssessments'] }, 100] }, 1]
            }
          }
        },
        { $sort: { completionRate: -1 } },
        { $limit: 5 }
      ]),

      // 🟡 Top Hazards
      HIRA.aggregate([
        { $match: baseMatch },
        { $unwind: '$worksheetRows' },
        {
          $group: {
            _id: '$worksheetRows.hazardConcern',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),

      // 🟡 Significant vs Non-significant
      HIRA.aggregate([
        { $match: baseMatch },
        { $unwind: '$worksheetRows' },
        {
          $group: {
            _id: '$worksheetRows.significantNotSignificant',
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, type: '$_id', count: 1 } }
      ])
    ]);

    // 🧮 Process trend data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const processedRiskTrend = riskTrend.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      risk: item._id.risk,
      count: item.count
    }));

    const totalRiskTasks = riskDistribution.reduce((sum, item) => sum + item.count, 0);

    // ✅ Final response
    res.json({
      stats: {
        totalAssessments,
        assignedAssessments,
        inProgressAssessments,
        completedAssessments,
        approvedAssessments,
        closedAssessments,
        ...actionsSummary,
        highRiskItems,
        avgClosureTime,
        totalRiskTasks,
        charts: {
          riskDistribution,
          riskTrend: processedRiskTrend,
          statusDistribution,
          significanceSummary,
          hazardFrequency,
          plantSummary,
          assessorPerformance
        },
        recentAssessments
      }
    });

  } catch (error) {
    console.error('HIRA Dashboard Error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching dashboard data.'
    });
  }
});


// ✅ Helper: Role-based filter builder
function buildRoleFilter(user, companyId) {
  const filter = { companyId: new mongoose.Types.ObjectId(companyId) };

  switch (user.role) {
    case 'superadmin':
      // 🔹 Superadmin: Full company access (no extra filters)
      break;

    case 'admin':
      // 🔹 Admin: Can only see assessments in their plant
      if (user.plantId?._id || user.plantId) {
        filter.plantId = user.plantId._id || user.plantId;
      }
      break;

    case 'assessor':
      // 🔹 Assessor: Only assessments assigned to them
      filter.assessor = user._id;
      break;

    case 'user':
    case 'hod':
    case 'safety_incharge':
      // 🔹 User / HOD / Safety Incharge: Same plant + assigned as assessor or in team
      filter.$and = [
        { plantId: user.plantId?._id || user.plantId },
        {
          $or: [
            { assessor: user._id },
            { team: user._id }
          ]
        }
      ];
      break;

    default:
      // 🔹 Fallback: Only data assigned or part of team
      filter.$or = [
        { assessor: user._id },
        { team: user._id }
      ];
  }

  return filter;
}


// GET: All HIRA assessments
router.get('/:companyId',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, status, plantId, search } = req.query;

      const user = req.user;
      const companyObjectId = new mongoose.Types.ObjectId(companyId);

      // 🧩 Step 1: Base filter from role
      const filter = buildRoleFilter(user, companyObjectId);

      // 🧭 Step 2: Additional query filters
      if (status && status !== 'all') filter.status = status;

      if (plantId && plantId !== 'all') {
        filter.plantId = new mongoose.Types.ObjectId(plantId);
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { assessmentNumber: { $regex: search, $options: 'i' } },
          { process: { $regex: search, $options: 'i' } }
        ];
      }

      // 📦 Step 3: Fetch paginated results
      const [assessments, total] = await Promise.all([
        HIRA.find(filter)
          .populate('assessor', 'name email role')
          .populate('plantId', 'name code')
          .populate('team', 'name role')
          .sort({ createdAt: -1 })
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit)),

        HIRA.countDocuments(filter)
      ]);

      // ✅ Step 4: Return response
      res.json({
        success: true,
        message: 'Assessments fetched successfully',
        assessments: assessments,
        pagination: {
          total,
          totalPages: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
          pageSize: Number(limit)
        }
      });
    } catch (error) {
      console.error('HIRA List Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching HIRA data.'
      });
    }
  }
);

// GET: HIRA assessment by ID
router.get('/:companyId/:id',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const user = req.user;
      const assessment = await HIRA.findOne({ _id: id, companyId })
        .populate('assessor', 'name email role')
        .populate('plantId', 'name code areas')
        .populate('team', 'name role email')
        .populate('approvedBy', 'name email')
        .populate('worksheetRows.actionOwner', 'name email');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      // ===== Role-based Access Control =====
      let canAccess = false;

      // Superadmin → can access all company data
      if (user.role === 'superadmin') {
        canAccess = true;
      }
      // Admin → can access HIRA within their assigned plant
      else  {
        if (
          assessment.plantId &&
          user.plantId &&
          assessment.plantId._id.toString() === user.plantId._id.toString()
        ) {
          canAccess = true;
        }
      }
      

      if (!canAccess) {
        return res.status(403).json({
          message: 'You are not authorized to access this HIRA record',
        });
      }

      // ===== Send Data =====
      res.json({ assessment });

    } catch (error) {
      console.error('Error fetching HIRA:', error);
      res.status(500).json({ message: error.message });
    }
  }
);


// POST: Create HIRA assessment
router.post('/:companyId',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const company = await Company.findById({_id:companyId});
      if (!company) return res.status(404).json({ message: 'Company not found' });
      const {leadAccessor, ...rest} = req.body;
      const hiraConfig = {
        statusMap: { draft: 'draft', assigned: 'assigned', inProgress: 'in_progress', completed: 'completed', approved: 'approved' }
      };

      const assessmentData = {
        ...rest,
        companyId,
        assessor: leadAccessor,
        assessmentNumber: await NumberGenerator.generateNumber(companyId, 'hira'),
        status: hiraConfig.statusMap.draft,
        worksheetRows: [],
        createdBy: req.user._id
      };

      const assessment = new HIRA(assessmentData);
      await assessment.save();
      
      await assessment.populate('assessor', 'name email');
      await assessment.populate('plantId', 'name code');
      await assessment.populate('team', 'name role email');

      res.status(201).json({
        message: 'HIRA assessment created successfully',
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// PATCH: Update HIRA assessment
router.patch('/:companyId/:id',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const {leadAccessor, ...rest} = req.body;
      const updates = {
        ...rest,
        assessor: leadAccessor
      };

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        updates,
        { new: true, runValidators: true }
      )
      .populate('assessor', 'name email')
      .populate('plantId', 'name code')
      .populate('team', 'name role email');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      res.json({
        message: 'HIRA assessment updated successfully',
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: Assign HIRA to team
router.post('/:companyId/:id/assign',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { team, comments, dueDate, priority } = req.body;

      const company = await Company.findById(companyId);
      const hiraConfig =  { statusMap: { assigned: 'assigned' } };

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        { 
          team,
          status: hiraConfig.statusMap.assigned,
          assignedAt: new Date(),
          approvalComments: comments,
          reviewDate: dueDate ? new Date(dueDate) : null,
          priority
        },
        { new: true }
      )
      .populate('team', 'name email role')
      .populate('plantId', 'name code');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      // Notify team members and assessor
      const assignerName = req.user.name;
      const assessorId = assessment.assessor;
      const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'Not specified';

      // ============ Notify and Email Team Members ============
      if (team && team.length > 0) {
        const teamUserIds = team.map(memberId => new mongoose.Types.ObjectId(memberId));

        for (const member of assessment.team) {
          // 🔔 Create in-app notification
          createNotification(
            member._id,
            'HIRA Assigned to Your Team',
            `${assignerName} assigned a new HIRA assessment: ${assessment.title} (${assessment.assessmentNumber}) to your team.`,
            'hira_assigned',
            {
              hiraId: assessment._id,
              plantId: assessment.plantId?._id,
              link: `/hira/assessments/${assessment._id}`
            }
          );

          // 📧 Send email
          // if (member.email) {
          //   const { subject, html } = emailTemplates.hiraAssigned(
          //     assessment.assessmentNumber,
          //     assessment.title,
          //     formattedDueDate,
          //     `${process.env.CLIENT_URL}/hira/assessments/${assessment._id}`
          //   );

          //   await sendEmail(member.email, subject, html).catch(err => {
          //     console.error(`Failed to send email to ${member.email}:`, err.message);
          //   });
          // }
        }

        // ⏰ Schedule reminder if due date exists
        if (dueDate) {
          await scheduleHiraReminder(
            assessment._id.toString(),
            new Date(dueDate),
            team.map(id => id.toString())
          );
        }
      }

      // ============ Notify and Email Assessor ============
      if (assessorId) {
        createNotification(
          assessorId,
          'HIRA Assigned to You',
          `${assignerName} assigned a new HIRA assessment: ${assessment.title} (${assessment.assessmentNumber}) to you.`,
          'hira_assigned',
          {
            hiraId: assessment._id,
            plantId: assessment.plantId?._id,
            link: `/hira/assessments/${assessment._id}`
          }
        );

        // const assessorUser = await User.findById(assessorId).select('email name');
        // if (assessorUser?.email) {
        //   const { subject, html } = emailTemplates.hiraAssigned(
        //     assessment.assessmentNumber,
        //     assessment.title,
        //     formattedDueDate,
        //     `${process.env.CLIENT_URL}/hira/assessments/${assessment._id}`
        //   );

        //   await sendEmail(assessorUser.email, subject, html).catch(err => {
        //     console.error(`Failed to send email to assessor ${assessorUser.email}:`, err.message);
        //   });
        // }
      }

      res.json({
        message: 'HIRA assessment assigned successfully',
        assessment
      });

    } catch (error) {
      console.error('Error assigning HIRA:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// PATCH: Update worksheet
router.patch('/:companyId/:id/worksheet',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      let { worksheetRows } = req.body;

      if (!Array.isArray(worksheetRows)) {
        worksheetRows = [worksheetRows];
      }

      worksheetRows = worksheetRows.map(row => ({
        ...row,
        actionOwner: row.actionOwner || null
      }));

      const company = await Company.findById(companyId);
      const hiraConfig = { statusMap: { inProgress: 'in_progress' } };

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        { 
          worksheetRows,
          status: hiraConfig.statusMap.inProgress || 'in_progress',
          startedAt: new Date()
        },
        { new: true }
      );

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }
      
      res.json({
        message: 'Worksheet updated successfully',
        assessment
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: Complete worksheet
// POST: Mark HIRA as Completed
router.post('/:companyId/:id/complete',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      let { worksheetRows } = req.body;

      if (!Array.isArray(worksheetRows)) {
        worksheetRows = [worksheetRows];
      }

      worksheetRows = worksheetRows.map(row => ({
        ...row,
        actionOwner: row.actionOwner || null
      }));

      const company = await Company.findById(companyId);
      const hiraConfig = { statusMap: { completed: 'completed' } };

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        {
          worksheetRows,
          status: hiraConfig.statusMap.completed || 'completed',
          completedAt: new Date()
        },
        { new: true }
      )
        .populate('assessor', 'name email')
        .populate('plantId', 'name code');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      // Cancel the HIRA team reminder
      await cancelJob('send hira reminder', { hiraId: assessment._id.toString() });

      // Find the primary approver (assessor or next approver)
      const approver = await User.findOne({
        companyId,
        _id: assessment.assessor
      });


      // ============= Notify and Email Approver =============
      if (approver) {
        // 🔔 In-app notification
        createNotification(
          approver._id,
          'HIRA Assessment Submitted for Approval',
          `${assessment.assessor.name} submitted HIRA ${assessment.assessmentNumber} (${assessment.title}) for your review.`,
          'hira_submitted',
          {
            hiraId: assessment._id,
            plantId: assessment.plantId?._id,
            link: `/hira/assessments/${assessment._id}/approve`
          }
        );

        // ⏰ Schedule approval reminder
        await scheduleApprovalReminder(
          assessment._id.toString(),
          approver._id.toString(),
          '48 hours'
        );

        // 📧 Send email to approver
        // if (approver.email) {
        //   const { subject, html } = emailTemplates.hiraCompleted(
        //     assessment.assessmentNumber,
        //     assessment.title,
        //     assessment.assessor.name,
        //     `${process.env.CLIENT_URL}/hira/assessments/${assessment._id}/approve`
        //   );

        //   await sendEmail(approver.email, subject, html).catch(err => {
        //     console.error(`Failed to send email to approver ${approver.email}:`, err.message);
        //   });
        // }
      }

      res.json({
        message: 'HIRA assessment completed successfully',
        assessment
      });
    } catch (error) {
      console.error('Error completing HIRA:', error);
      res.status(500).json({ message: error.message });
    }
  }
);


// POST: Approve/Reject HIRA
router.post('/:companyId/:id/approve',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { action, comments } = req.body;

      const company = await Company.findById(companyId);
      const hiraConfig = {
        statusMap: { approved: 'approved', rejected: 'rejected' }
      };

      const hira = await HIRA.findById(id);

      // 🔒 Validate Approver
      if (
        hira.assessor.toString() !== req.user._id.toString() &&
        hira.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: 'You are not authorized to approve this HIRA' });
      }

      // 🧩 Prepare Update Data
      const updateData = {
        approvalComments: comments,
        approvedBy: req.user._id
      };

      if (action === 'approve') {
        updateData.status = hiraConfig.statusMap.approved || 'approved';
        updateData.approvedAt = new Date();
      } else {
        updateData.status = hiraConfig.statusMap.rejected || 'rejected';
        updateData.rejectionReason = comments;
      }

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        updateData,
        { new: true }
      )
        .populate('assessor', 'name email')
        .populate('approvedBy', 'name email')
        .populate('team', 'name role email')
        .populate('plantId', 'name code');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      // 🛑 Cancel the approval reminder job
      await cancelJob('send approval reminder', { hiraId: assessment?._id?.toString() });

      const approverName = assessment.approvedBy?.name || req.user.name;
      const formattedStatus = action === 'approve' ? 'Approved' : 'Rejected';
      const formattedDate = new Date().toLocaleDateString();

      // ========== Notify Assessor ==========
      const assessorId = assessment.assessor?._id;
      if (assessorId) {
        createNotification(
          assessorId,
          `HIRA Assessment ${formattedStatus}!`,
          `${approverName} has ${formattedStatus.toLowerCase()} your HIRA assessment: ${assessment.assessmentNumber}.`,
          `hira_${action}`,
          {
            hiraId: assessment._id,
            plantId: assessment.plantId?._id,
            link: `/hira/assessments/${assessment._id}`
          }
        );

        // 📧 Send email to assessor
        // if (assessment.assessor?.email) {
        //   const { subject, html } = emailTemplates.hiraApproval(
        //     assessment.assessmentNumber,
        //     assessment.title,
        //     approverName,
        //     formattedStatus,
        //     comments,
        //     `${process.env.CLIENT_URL}/hira/assessments/${assessment._id}`
        //   );

        //   await sendEmail(assessment.assessor.email, subject, html).catch(err => {
        //     console.error(`Failed to send email to assessor ${assessment.assessor.email}:`, err.message);
        //   });
        // }
      }

      // ========== Notify and Email Team Members ==========
      if (assessment.team && assessment.team.length > 0) {
        for (const member of assessment.team) {
          // 🔔 Create team notifications
          createNotification(
            member._id,
            `HIRA Assessment ${formattedStatus}`,
            `The HIRA assessment ${assessment.assessmentNumber} (${assessment.title}) has been ${formattedStatus.toLowerCase()} by ${approverName}.`,
            `hira_${action}`,
            {
              hiraId: assessment._id,
              plantId: assessment.plantId?._id,
              link: `/hira/assessments/${assessment._id}`
            }
          );

          // 📧 Send email to each team member
          // if (member.email) {
          //   const { subject, html } = emailTemplates.hiraApproval(
          //     assessment.assessmentNumber,
          //     assessment.title,
          //     approverName,
          //     formattedStatus,
          //     comments,
          //     `${process.env.CLIENT_URL}/hira/assessments/${assessment._id}`
          //   );

          //   await sendEmail(member.email, subject, html).catch(err => {
          //     console.error(`Failed to send email to team member ${member.email}:`, err.message);
          //   });
          // }
        }
      }

      res.json({
        message: `HIRA assessment ${action}d successfully`,
        assessment
      });

    } catch (error) {
      console.error('Error in HIRA approval:', error);
      res.status(500).json({ message: error.message });
    }
  }
);


// POST: Assign actions
router.post("/:companyId/:id/assign-actions",
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { worksheetRows } = req.body;

      // ===== Update HIRA with assigned actions =====
      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        {
          worksheetRows,
          status: "actions_assigned",
          actionsAssignedAt: new Date(),
        },
        { new: true }
      )
        .populate("worksheetRows.actionOwner", "name email")
        .populate("assessor", "name email")
        .populate("plantId", "name code");

      if (!assessment) {
        return res.status(404).json({ message: "HIRA assessment not found" });
      }

      // ===== Identify unique action owners =====
      const uniqueOwners = [
        ...new Map(
          worksheetRows
            .filter(row => row.actionOwner && row.recommendation)
            .map(row => [row.actionOwner._id?.toString(), row.actionOwner])
        ).values(),
      ];

      // ===== Send notifications & emails =====
      for (const owner of uniqueOwners) {
        // Create in-app notification
        await createNotification(
          owner._id,
          "New Action Items Assigned",
          `You have been assigned action items from HIRA assessment: ${assessment.assessmentNumber}.`,
          "action_assigned",
          {
            hiraId: assessment._id,
            plantId: assessment.plantId._id,
            link: `/hira/assessments/${assessment._id}/actions`,
          }
        );

        // Send email
        // const ownerUser = await User.findById(owner._id).select('email name');
        // if (ownerUser?.email) {
        //   const subject = `HIRA Action Assigned - ${assessment.assessmentNumber}`;
        //   const html = `
        //     <p>Dear ${ownerUser.name || "Team Member"},</p>
        //     <p>You have been assigned one or more action items as part of the HIRA assessment <b>${assessment.assessmentNumber}</b>.</p>
        //     <p><b>Plant:</b> ${assessment.plantId?.name || "N/A"} (${assessment.plantId?.code || ""})</p>
        //     <p>Please review your assigned actions at your earliest convenience.</p>
        //     <p>
        //       <a href="${process.env.CLIENT_URL}/hira/assessments/${assessment._id}/actions"
        //          style="background:#007bff;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
        //         View Assigned Actions
        //       </a>
        //     </p>
        //     <p>Best Regards,<br/>Safety Team</p>
        //   `;
        //   await sendEmail(ownerUser.email, subject, html);
        // }
      }

      // ===== Respond to client =====
      res.json({
        message: "Actions assigned successfully and notifications sent.",
        assessment,
      });

    } catch (error) {
      console.error("Error assigning actions:", error);
      res.status(500).json({ message: error.message });
    }
  }
);


// PATCH: Update action status
router.patch('/:companyId/:id/actions/:actionIndex',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id, actionIndex } = req.params;
      const { actionStatus, completedDate, remarks, completionEvidence } = req.body;

      const assessment = await HIRA.findOne({ _id: id, companyId });
      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      if (actionIndex >= assessment.worksheetRows.length) {
        return res.status(400).json({ message: 'Invalid action index' });
      }

      // Update the specific action
      assessment.worksheetRows[actionIndex].actionStatus = actionStatus;
      assessment.worksheetRows[actionIndex].remarks = remarks || assessment.worksheetRows[actionIndex].remarks;
      assessment.worksheetRows[actionIndex].completionEvidence = completionEvidence || assessment.worksheetRows[actionIndex].completionEvidence;

      if (actionStatus === 'Completed' && !assessment.worksheetRows[actionIndex].actualCompletionDate) {
        assessment.worksheetRows[actionIndex].actualCompletionDate = completedDate || new Date();
      }

      // Check if all actions are completed
      const actionItems = assessment.worksheetRows.filter(row => row.recommendation && row.recommendation.trim() !== '');
      const completedActions = actionItems.filter(row => row.actionStatus === 'Completed');

      if (completedActions.length === actionItems.length && actionItems.length > 0) {
        assessment.status = 'actions_completed';
        assessment.actionsCompletedAt = new Date();
      }

      await assessment.save();

      // Populate the updated assessment
      await assessment.populate('worksheetRows.actionOwner', 'name email');

      res.json({
        message: 'Action updated successfully',
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: Complete all actions
router.post('/:companyId/:id/complete-actions',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        { 
          status: 'actions_completed',
          actionsCompletedAt: new Date()
        },
        { new: true }
      )
      .populate('assessor', 'name email');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      // Notify the assessor
      createNotification(
        assessment.assessor._id,
        'All Action Items Completed',
        `All action items for HIRA assessment ${assessment.assessmentNumber} have been completed.`,
        'actions_completed',
        { hiraId: assessment._id, plantId: assessment.plantId, link: `/hira/assessments/${assessment._id}` }
      );

      res.json({
        message: 'All actions completed successfully',
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: Close HIRA
router.post("/:companyId/:id/close",
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      // ===== Update assessment status =====
      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        {
          status: "closed",
          closedAt: new Date(),
        },
        { new: true }
      )
        .populate("assessor", "name email")
        .populate("plantId", "name code");

      if (!assessment) {
        return res.status(404).json({ message: "HIRA assessment not found" });
      }

      // ===== Cancel all pending reminders =====
      await cancelJob("send hira reminder", { hiraId: id });
      await cancelJob("send approval reminder", { hiraId: id });

      // ===== Create in-app notification =====
      const closerName = req.user?.name || "System";
      if (assessment.assessor?._id) {
        await createNotification(
          assessment.assessor._id,
          "HIRA Assessment Closed",
          `${closerName} has closed the HIRA assessment: ${assessment.assessmentNumber}.`,
          "system",
          {
            hiraId: assessment._id,
            plantId: assessment.plantId?._id,
            link: `/hira/assessments/${assessment._id}`,
          }
        );
      }

      // ===== Send email to assessor =====
      // if (assessment.assessor?.email) {
      //   const subject = `HIRA Assessment Closed - ${assessment.assessmentNumber}`;
      //   const html = `
      //     <p>Dear ${assessment.assessor.name || "Assessor"},</p>
      //     <p>The HIRA assessment <b>${assessment.assessmentNumber}</b> has been <b>closed</b> by ${closerName}.</p>
      //     <p><b>Plant:</b> ${assessment.plantId?.name || "N/A"} (${assessment.plantId?.code || ""})</p>
      //     <p>You can review the assessment details below:</p>
      //     <p>
      //       <a href="${process.env.CLIENT_URL}/hira/assessments/${assessment._id}"
      //          style="background:#28a745;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
      //         View HIRA Assessment
      //       </a>
      //     </p>
      //     <p>Best regards,<br/>Safety Management System</p>
      //   `;
      //   await sendEmail(assessment.assessor.email, subject, html);
      // }

      // ===== Response =====
      res.json({
        message: "HIRA assessment closed successfully, notification and email sent.",
        assessment,
      });

    } catch (error) {
      console.error("Error closing HIRA assessment:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: AI Suggestions
router.post('/:companyId/:id/ai-suggestions',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { taskName, activityService, existingHazards = [] } = req.body;

      const prompt = `
        As a safety expert, provide suggestions for the following industrial task:

        Task: ${taskName}
        Activity/Service: ${activityService}
        Existing identified hazards: ${existingHazards.join(', ') || 'None identified yet'}

        Please provide:
        1. Additional potential hazards that might be missed
        2. Hazard Description
        3. Routine/Non Routine
        4. Risk control measures
        5. likelihood of occurrence (1-5)
        6. Consequence of the hazard (1-5)
        7. Significant/Not Significant (S/NS)
        8. Safety recommendations

        Format the response as JSON with the following structure:
        {
          "hazards": ["hazard1", "hazard2"],
          "description": ["description"],
          "controls": ["control1", "control2"], 
          "recommendations": ["recommendation1", "recommendation2"],
          "routine": ['Routine/Non Routine'],
          "likelihood": [3],
          "consequence": [4],
          "significant": ['Not Significant'],
          "confidence": 0.95
        }
      `;

      // Call Gemini API
      const apiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await apiResponse.json();
      let suggestions;
      try {
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = rawText
          .replace(/^```json\s*/i, '')   // remove leading ```json
          .replace(/^```\s*/i, '')       // (optional) if only ``` used
          .replace(/```$/i, '')          // remove trailing ```
          .trim();
        suggestions = JSON.parse(cleanedText);
      } catch (parseError) {
        suggestions = {
          hazards: ['Manual handling injuries', 'Slip, trip, fall hazards'],
          controls: ['Proper PPE usage', 'Safety training'],
          description: ['Description'],
          recommendations: ['Conduct regular safety audits', 'Implement safety procedures'],
          routine: ['Routine'],
          likelihood: [3],
          consequence: [4],
          significant: ['Not Significant'],
          confidence: 0.8
        };
      }

      // Save AI suggestions to HIRA
      await HIRA.findByIdAndUpdate(id, {
        aiSuggestions: {
          ...suggestions,
          generatedAt: new Date()
        }
      });

      const assessment = await HIRA.findById(id).select('assessor assessmentNumber plantId');
      
      

      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET: Download assessment
router.get('/:companyId/:id/download/:format',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id, format } = req.params;
      
      const assessment = await HIRA.findOne({ _id: id, companyId })
        .populate('assessor', 'name email')
        .populate('plantId', 'name code')
        .populate('team', 'name role')
        .populate('worksheetRows.actionOwner', 'name');

      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('HIRA Assessment');

        worksheet.addRow([
          'Task Name', 'Activity/Service', 'R/NR', 'Hazard/Concern',
          'Hazard Description', 'Likelihood', 'Consequence', 'Risk Score',
          'Existing Risk Control', 'S/NS', 'Risk Category', 'Recommendation',
          'Action Owner', 'Target Date', 'Action Status', 'Remarks'
        ]);

        assessment.worksheetRows.forEach(row => {
          worksheet.addRow([
            row.taskName,
            row.activityService,
            row.routineNonRoutine,
            row.hazardConcern,
            row.hazardDescription,
            row.likelihood,
            row.consequence,
            row.riskScore,
            row.existingRiskControl,
            row.significantNotSignificant,
            row.riskCategory,
            row.recommendation,
            row.actionOwner?.name || '',
            row.targetDate ? new Date(row.targetDate).toLocaleDateString() : '',
            row.actionStatus,
            row.remarks || ''
          ]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=HIRA-${assessment.assessmentNumber}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
      } else if (format === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=HIRA-${assessment.assessmentNumber}.pdf`);
        
        doc.pipe(res);
        doc.fontSize(16).text(`HIRA Assessment: ${assessment.title}`, 50, 50);
        doc.fontSize(12).text(`Assessment Number: ${assessment.assessmentNumber}`, 50, 80);
        doc.text(`Plant: ${assessment.plantId.name}`, 50, 100);
        doc.text(`Process: ${assessment.process}`, 50, 120);
        
        let yPosition = 160;
        assessment.worksheetRows.forEach((row, index) => {
          doc.text(`${index + 1}. ${row.taskName}`, 50, yPosition);
          doc.text(`    Hazard: ${row.hazardConcern}`, 70, yPosition + 15);
          doc.text(`    Risk Score: ${row.riskScore} (${row.riskCategory})`, 70, yPosition + 30);
          doc.text(`    Recommendation: ${row.recommendation}`, 70, yPosition + 45);
          yPosition += 80;
          
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
        });
        
        doc.end();
      } else if (format === 'word') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: `HIRA Assessment: ${assessment.title}`,
                heading: 'Title'
              }),
              new Paragraph({
                text: `Assessment Number: ${assessment.assessmentNumber}`
              }),
              new Paragraph({
                text: `Plant: ${assessment.plantId.name}`
              }),
              new Table({
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph('Task Name')] }),
                      new TableCell({ children: [new Paragraph('Hazard')] }),
                      new TableCell({ children: [new Paragraph('Risk Score')] }),
                      new TableCell({ children: [new Paragraph('Category')] }),
                      new TableCell({ children: [new Paragraph('Recommendation')] })
                    ]
                  }),
                  ...assessment.worksheetRows.map(row => new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(row.taskName)] }),
                      new TableCell({ children: [new Paragraph(row.hazardConcern)] }),
                      new TableCell({ children: [new Paragraph(String(row.riskScore))] }),
                      new TableCell({ children: [new Paragraph(row.riskCategory)] }),
                      new TableCell({ children: [new Paragraph(row.recommendation)] })
                    ]
                  }))
                ]
              })
            ]
          }]
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=HIRA-${assessment.assessmentNumber}.docx`);
        
        const buffer = await Packer.toBuffer(doc);
        res.send(buffer);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
