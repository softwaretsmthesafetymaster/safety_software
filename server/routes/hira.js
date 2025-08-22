import express from 'express';
import HIRA from '../models/HIRA.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';
import { 
  validateHIRACreation, 
  validateHazardAssessment, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';

const router = express.Router();


// Get all HIRA assessments for a company
router.get('/:companyId', 
  validateCompanyId, 
  validatePagination, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status, plantId } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;
    if (plantId) filter.plantId = plantId;

    const assessments = await HIRA.find(filter)
      .populate('assessor', 'name email')
      .populate('plantId', 'name code')
      .populate('team', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HIRA.countDocuments(filter);

    res.json({
      assessments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new HIRA assessment
router.post('/:companyId', 
  validateCompanyId, 
  validateHIRACreation, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const assessmentData = {
      ...req.body,
      companyId,
      assessor: req.user._id,
      assessmentNumber: await NumberGenerator.generateNumber(companyId, 'hira')
    };

    const assessment = new HIRA(assessmentData);
    await assessment.save();

    await assessment.populate('assessor', 'name email');
    await assessment.populate('plantId', 'name code');

    res.status(201).json({
      message: 'HIRA assessment created successfully',
      assessment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get HIRA assessment by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const assessment = await HIRA.findOne({ _id: id, companyId })
      .populate('assessor', 'name email role')
      .populate('plantId', 'name code areas')
      .populate('team', 'name role email');

    if (!assessment) {
      return res.status(404).json({ message: 'HIRA assessment not found' });
    }

    res.json({ assessment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update HIRA assessment
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const assessment = await HIRA.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    ).populate('assessor', 'name email')
     .populate('plantId', 'name code');

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
});

// Get HIRA statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      inProgress,
      completed,
      highRiskItems,
      recentAssessments
    ] = await Promise.all([
      HIRA.countDocuments({ companyId }),
      HIRA.countDocuments({ companyId, status: 'in_progress' }),
      HIRA.countDocuments({ companyId, status: 'completed' }),
      HIRA.aggregate([
        { $match: { companyId: companyId } },
        { $unwind: '$activities' },
        { $unwind: '$activities.hazards' },
        { $match: { 'activities.hazards.riskLevel': { $in: ['high', 'very_high'] } } },
        { $count: 'count' }
      ]),
      HIRA.find({ companyId })
        .populate('assessor', 'name')
        .populate('plantId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      stats: {
        total,
        inProgress,
        completed,
        highRiskItems: highRiskItems[0]?.count || 0,
        recentAssessments
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;