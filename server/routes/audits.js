import express from 'express';
import Audit from '../models/Audit.js';
import Observation from '../models/Observation.js';
import Company from '../models/Company.js';
import mongoose from 'mongoose';
import ChecklistTemplate from '../models/ChecklistTemplate.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';
import { generateAuditReport } from '../utils/reportGenerator.js';

const router = express.Router();

// Get all audits for a company
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status, type, plantId } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (plantId) filter.plantId = plantId;

    const audits = await Audit.find(filter)
      .populate('auditor', 'name email')
      .populate('plantId', 'name code')
      .populate('templateId', 'name standard')
      .populate('auditTeam.member', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Audit.countDocuments(filter);

    res.json({
      audits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new audit
router.post('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
   
    const { companyId } = req.params;
    const auditData = {
      ...req.body,
      companyId,
      auditor: req.user._id,
      auditNumber: await NumberGenerator.generateNumber(companyId, 'audit')
    };
    
    const audit = new Audit(auditData);
    
    await audit.save();
    

    await audit.populate('auditor', 'name email');
    await audit.populate('plantId', 'name code');
    await audit.populate('templateId', 'name standard');
    
    res.status(201).json({
      message: 'Audit created successfully',
      audit
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Get audit by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const audit = await Audit.findOne({ _id: id, companyId })
      .populate('auditor', 'name email role')
      .populate('plantId', 'name code areas')
      .populate('templateId', 'name standard description')
      .populate('auditTeam.member', 'name role email')
      .populate('auditee', 'name role')
      .populate('observations');

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({ audit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update audit
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const audit = await Audit.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    ).populate('auditor', 'name email')
     .populate('plantId', 'name code')
     .populate('templateId', 'name standard');

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({
      message: 'Audit updated successfully',
      audit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start audit
router.post('/:companyId/:id/start', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const audit = await Audit.findOneAndUpdate(
      { _id: id, companyId },
      { 
        status: 'in_progress',
        actualDate: new Date()
      },
      { new: true }
    );

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({
      message: 'Audit started successfully',
      audit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Close audit
router.post('/:companyId/:id/close', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { closureComments } = req.body;

    // Check if all observations are approved
    const observations = await Observation.find({ auditId: id });
    const pendingObservations = observations.filter(obs => obs.status !== 'approved');
    
    if (pendingObservations.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot close audit. There are pending observations that need to be approved.' 
      });
    }

    const audit = await Audit.findOneAndUpdate(
      { _id: id, companyId },
      {
        status: 'closed',
        closedBy: req.user._id,
        closedAt: new Date(),
        closureComments
      },
      { new: true }
    );

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({
      message: 'Audit closed successfully',
      audit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get audit statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      planned,
      inProgress,
      completed,
      closed,
      avgCompliance,
      recentAudits,
      observationStats
    ] = await Promise.all([
      Audit.countDocuments({ companyId }),
      Audit.countDocuments({ companyId, status: 'planned' }),
      Audit.countDocuments({ companyId, status: { $in: ['in_progress', 'checklist_completed', 'observations_pending'] } }),
      Audit.countDocuments({ companyId, status: 'completed' }),
      Audit.countDocuments({ companyId, status: 'closed' }),
      Audit.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), 'summary.compliancePercentage': { $exists: true } } },
        { $group: { _id: null, avgCompliance: { $avg: '$summary.compliancePercentage' } } }
      ]),
      Audit.find({ companyId })
        .populate('auditor', 'name')
        .populate('plantId', 'name')
        .populate('templateId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Observation.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: { $toLower: '$status' }, // normalize statuses
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const observationCounts = observationStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      stats: {
        total,
        planned,
        inProgress,
        completed,
        closed,
        avgCompliance: avgCompliance[0]?.avgCompliance || 0,
        recentAudits,
        observations: {
          total: Object.values(observationCounts).reduce((a, b) => a + b, 0),
          open: observationCounts.open || 0,
          assigned: observationCounts.assigned || 0,
          in_progress: observationCounts.in_progress || 0,
          completed: observationCounts.completed || 0,
          approved: observationCounts.approved || 0,
          rejected: observationCounts.rejected || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Generate audit report
router.get('/:companyId/:id/report/:format', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id, format } = req.params;
    
    const audit = await Audit.findOne({ _id: id, companyId })
      .populate('auditor', 'name email')
      .populate('plantId', 'name code address')
      .populate('templateId', 'name standard')
      .populate('auditTeam.member', 'name role')
      .populate('observations')
      .populate({
        path: 'observations',
        populate: {
          path: 'responsiblePerson',
          select: 'name role'
        }
      });

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }
    const company = await Company.findById(companyId);

    const reportBuffer = await generateAuditReport(audit, format, company);
    
    const filename = `Audit_Report_${audit.auditNumber}.${format}`;
    
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(reportBuffer);
  } catch (error) {
    console.log("Error in report download: ",error)
    res.status(500).json({ message: error.message });
  }
});

function getContentType(format) {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'word':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

// Area (Department) compliance analytics
router.get('/:companyId/analytics/department-compliance', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { dateFrom, dateTo, status, standard, type } = req.query;

    const matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (dateFrom && dateTo) {
      matchStage.scheduledDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }
    if (status) matchStage.status = status;
    if (standard) matchStage.standard = standard;
    if (type) matchStage.type = type;

    const departmentCompliance = await Audit.aggregate([
      { $match: matchStage },

      // AREA Lookup
      {
        $lookup: {
          from: "areas",
          localField: "areaId",
          foreignField: "_id",
          as: "area"
        }
      },
      { $unwind: "$area" },

      {
        $group: {
          _id: {
            areaId: "$areaId",
            areaName: "$area.name"
          },
          totalAudits: { $sum: 1 },
          totalQuestions: { $sum: "$summary.totalQuestions" },
          answeredQuestions: { $sum: "$summary.answered" },
          yesAnswers: { $sum: "$summary.yesAnswers" },
          noAnswers: { $sum: "$summary.noAnswers" },
          naAnswers: { $sum: "$summary.naAnswers" },
          avgCompliance: { $avg: "$summary.compliancePercentage" }
        }
      },

      {
        $project: {
          areaId: "$_id.areaId",
          department: "$_id.areaName",
          total: "$noAnswers",
          major: "$noAnswers",
          minor: { $literal: 0 },
          compliance: { $round: ["$avgCompliance", 0] },
          totalQuestions: "$totalQuestions",
          answeredQuestions: "$answeredQuestions"
        }
      },

      { $sort: { compliance: -1 } }
    ]);

    res.json(departmentCompliance);

  } catch (error) {
    console.error("Area compliance error:", error);
    res.status(500).json({ message: error.message });
  }
});



// Clause compliance analytics
router.get('/:companyId/analytics/clause-compliance', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { dateFrom, dateTo, status, standard, type } = req.query;

    const matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (dateFrom && dateTo) {
      matchStage.scheduledDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }
    if (status) matchStage.status = status;
    if (standard) matchStage.standard = standard;
    if (type) matchStage.type = type;

    const clauseCompliance = await Audit.aggregate([
      { $match: matchStage },
      { $unwind: "$checklist" },

      {
        $group: {
          _id: "$checklist.clause",
          totalQuestions: { $sum: 1 },
          yesAnswers: { $sum: { $cond: [{ $eq: ["$checklist.answer", "yes"] }, 1, 0] } },
          noAnswers: { $sum: { $cond: [{ $eq: ["$checklist.answer", "no"] }, 1, 0] } },
          naAnswers: { $sum: { $cond: [{ $eq: ["$checklist.answer", "na"] }, 1, 0] } },
        }
      },

      {
        $project: {
          clause: "$_id",
          total: "$noAnswers",
          major: "$noAnswers",
          minor: { $literal: 0 },

          compliance: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $add: ["$yesAnswers", "$naAnswers"] }, "$totalQuestions"] },
                  100
                ]
              },
              0
            ]
          }
        }
      },

      { $match: { clause: { $ne: null } } },
      { $sort: { total: -1 } }
    ]);

    res.json(clauseCompliance);

  } catch (error) {
    console.error("Clause compliance error:", error);
    res.status(500).json({ message: error.message });
  }
});



// Monthly trends analytics
router.get('/:companyId/analytics/monthly-trends', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { dateFrom, dateTo, status, standard, type } = req.query;

    const matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };
    
    if (dateFrom && dateTo) {
      matchStage.scheduledDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }
    if (status) matchStage.status = status;
    if (standard) matchStage.standard = standard;
    if (type) matchStage.type = type;

    const monthlyTrends = await Audit.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$scheduledDate' },
            month: { $month: '$scheduledDate' }
          },
          audits: { $sum: 1 },
          totalObservations: { $sum: { $size: { $ifNull: ['$observations', []] } } },
          avgCompliance: { $avg: '$summary.compliancePercentage' },
          totalQuestions: { $sum: '$summary.totalQuestions' },
          answeredQuestions: { $sum: '$summary.answered' },
          noAnswers: { $sum: '$summary.noAnswers' }
        }
      },
      {
        $lookup: {
          from: 'observations',
          let: { 
            year: '$_id.year', 
            month: '$_id.month',
            companyId: new mongoose.Types.ObjectId(companyId)
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$companyId', '$$companyId'] },
                    { $eq: [{ $year: '$createdAt' }, '$$year'] },
                    { $eq: [{ $month: '$createdAt' }, '$$month'] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ],
          as: 'observationsBySeverity'
        }
      },
      {
        $project: {
          month: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          year: '$_id.year',
          observations: '$totalObservations',
          compliance: { $round: ['$avgCompliance', 0] },
          audits: '$audits',
          majorFindings: {
            $reduce: {
              input: '$observationsBySeverity',
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ['$$this._id', 'major'] },
                  '$$this.count',
                  '$$value'
                ]
              }
            }
          },
          minorFindings: {
            $reduce: {
              input: '$observationsBySeverity',
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ['$$this._id', 'minor'] },
                  '$$this.count',
                  '$$value'
                ]
              }
            }
          },
          totalQuestions: '$totalQuestions',
          answeredQuestions: '$answeredQuestions'
        }
      },
      { $sort: { year: 1, '_id.month': 1 } }
    ]);

    res.json(monthlyTrends);
  } catch (error) {
    console.error('Monthly trends error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:companyId/analytics/category-analysis', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { dateFrom, dateTo, status, standard, type } = req.query;

    const matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (dateFrom && dateTo) {
      matchStage.scheduledDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }
    if (status) matchStage.status = status;
    if (standard) matchStage.standard = standard;
    if (type) matchStage.type = type;

    const categoryAnalysis = await Audit.aggregate([
      { $match: matchStage },
      { $unwind: "$checklist" },

      {
        $group: {
          _id: "$checklist.categoryName",
          totalQuestions: { $sum: 1 },
          answeredQuestions: { $sum: { $cond: [{ $ne: ["$checklist.answer", null] }, 1, 0] } },
          yesAnswers: { $sum: { $cond: [{ $eq: ["$checklist.answer", "yes"] }, 1, 0] } },
          noAnswers: { $sum: { $cond: [{ $eq: ["$checklist.answer", "no"] }, 1, 0] } },
          naAnswers: { $sum: { $cond: [{ $eq: ["$checklist.answer", "na"] }, 1, 0] } }
        }
      },

      {
        $project: {
          category: "$_id",
          observations: "$noAnswers",

          compliance: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ["$yesAnswers", "$naAnswers"] },
                      "$totalQuestions"
                    ]
                  },
                  100
                ]
              },
              0
            ]
          },

          totalQuestions: "$totalQuestions",
          answeredQuestions: "$answeredQuestions",
          maxValue: { $max: ["$noAnswers", 100] }
        }
      },

      { $match: { category: { $ne: null } } },
      { $sort: { observations: -1 } }
    ]);

    res.json(categoryAnalysis);

  } catch (error) {
    console.error("Category analysis error:", error);
    res.status(500).json({ message: error.message });
  }
});



// Compliance Heatmap (Clause vs Area)
router.get('/:companyId/analytics/compliance-heatmap', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { dateFrom, dateTo, status, standard, type } = req.query;
    const matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (dateFrom && dateTo) {
      matchStage.scheduledDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }
    if (status) matchStage.status = status;
    if (standard) matchStage.standard = standard;
    if (type) matchStage.type = type;

    const heatmapData = await Audit.aggregate([
      { $match: matchStage },

      // 🔹 AREA Lookup
      {
        $lookup: {
          from: "areas",
          localField: "areaId",
          foreignField: "_id",
          as: "area"
        }
      },
      { $unwind: "$area" },

      { $unwind: "$checklist" },

      {
        $match: {
          "checklist.answer": "no",
          "checklist.clause": { $ne: null }
        }
      },

      {
        $group: {
          _id: {
            areaId: "$areaId",
            areaName: "$area.name",
            clause: "$checklist.clause"
          },
          count: { $sum: 1 }
        }
      },

      {
        $group: {
          _id: {
            areaId: "$_id.areaId",
            areaName: "$_id.areaName"
          },
          clauses: {
            $push: {
              clause: "$_id.clause",
              count: "$count"
            }
          }
        }
      },

      {
        $project: {
          areaId: "$_id.areaId",
          areaName: "$_id.areaName",
          clauses: {
            $arrayToObject: {
              $map: {
                input: "$clauses",
                as: "item",
                in: { k: "$$item.clause", v: "$$item.count" }
              }
            }
          }
        }
      }
    ]);

    // 📌 Distinct Clause Headers
    const clauseHeaders = await Audit.aggregate([
      { $match: matchStage },
      { $unwind: "$checklist" },
      { $match: { "checklist.clause": { $ne: null } } },
      { $group: { _id: "$checklist.clause" } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      data: heatmapData,
      clauseHeaders: clauseHeaders.map(c => c._id)
    });

  } catch (error) {
    console.error("Heatmap error:", error);
    res.status(500).json({ message: error.message });
  }
});



// Export dashboard data
router.get('/:companyId/export/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { format = 'excel' } = req.query;

    // This is a placeholder - implement your export logic here
    // You can use libraries like exceljs, pdfkit, etc.
    
    res.status(501).json({ message: 'Export functionality not implemented yet' });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;