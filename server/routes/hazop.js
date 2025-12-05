import express from 'express';
import HAZOP from '../models/HAZOP.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';
import { 
  validateHAZOPCreation, 
  validateNodeCreation, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';

const router = express.Router();


// Get all HAZOP studies for a company
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

    const studies = await HAZOP.find(filter)
      .populate('facilitator', 'name email')
      .populate('plantId', 'name code')
      .populate('team.member', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HAZOP.countDocuments(filter);

    res.json({
      studies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new HAZOP study
router.post('/:companyId', 
  validateCompanyId, 
  validateHAZOPCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const studyData = {
      ...req.body,
      companyId,
      facilitator: req.user._id,
      studyNumber: await NumberGenerator.generateNumber(companyId, 'hazop')
    };

    const study = new HAZOP(studyData);
    await study.save();

    await study.populate('facilitator', 'name email');
    await study.populate('plantId', 'name code');

    res.status(201).json({
      message: 'HAZOP study created successfully',
      study
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get HAZOP study by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const study = await HAZOP.findOne({ _id: id, companyId })
      .populate('facilitator', 'name email role')
      .populate('plantId', 'name code areas')
      .populate('team.member', 'name role email')
      .populate('nodes.worksheets.recommendations.responsibility', 'name role')
      .populate('chairman', 'name role')
      .populate('scribe', 'name role')
      .populate('nodes.worksheets.recommendations.responsibility', 'name role');

    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    res.json({ study });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update HAZOP study
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const study = await HAZOP.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    ).populate('facilitator', 'name email')
     .populate('plantId', 'name code');

    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    res.json({
      message: 'HAZOP study updated successfully',
      study
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start HAZOP study
router.post('/:companyId/:id/start', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const study = await HAZOP.findOne({ _id: id, companyId });
    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    study.status = 'in_progress';
    study.startedAt = new Date();

    await study.save();

    res.json({
      message: 'HAZOP study started successfully',
      study
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete HAZOP study
router.post('/:companyId/:id/complete', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const study = await HAZOP.findOne({ _id: id, companyId });
    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    study.status = 'completed';
    study.completionDate = new Date();

    await study.save();

    res.json({
      message: 'HAZOP study completed successfully',
      study
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Close HAZOP study
router.post('/:companyId/:id/close', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { closureComments } = req.body;

    const study = await HAZOP.findOne({ _id: id, companyId });
    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    study.status = 'closed';
    study.closedAt = new Date();
    study.closureComments = closureComments;

    await study.save();

    res.json({
      message: 'HAZOP study closed successfully',
      study
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Add session to HAZOP study
router.post('/:companyId/:id/sessions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const sessionData = req.body;

    const study = await HAZOP.findOne({ _id: id, companyId });
    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    study.sessions.push(sessionData);
    await study.save();

    res.json({
      message: 'Session added successfully',
      study
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add node to HAZOP study
router.post('/:companyId/:id/nodes', 
  validateCompanyId, 
  validateObjectId('id'), 
  validateNodeCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const nodeData = req.body;

    const study = await HAZOP.findOne({ _id: id, companyId });
    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    study.nodes.push(nodeData);
    await study.save();

    res.json({
      message: 'Node added successfully',
      study
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//add worksheet to node
router.post('/:companyId/:id/nodes/:nodeId/worksheet', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id, nodeId } = req.params;
    const worksheetData = req.body;
    const study = await HAZOP.findOne({ _id: id, companyId });
    if (!study) {
      return res.status(404).json({ message: 'HAZOP study not found' });
    }

    const node = study.nodes.id(nodeId);
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }
    node.worksheets=worksheetData.worksheets
    await study.save();
    res.json({
      message: 'Worksheet added successfully',
      study
    });
  } catch (error) {
    console.log(error); 
    res.status(500).json({ message: error.message });
  }
});
// Get AI suggestions for HAZOP
router.post('/:companyId/:id/ai-suggestions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { parameter, guideWord, process } = req.body;

    // Mock AI suggestions - replace with actual AI service
    const suggestions = {
      deviations: [
        `${parameter} ${guideWord}`,
        `Partial ${parameter} ${guideWord}`,
        `Complete ${parameter} ${guideWord}`
      ],
      causes: [
        'Equipment failure',
        'Human error',
        'External factors',
        'Process upset'
      ],
      consequences: [
        'Safety hazard',
        'Environmental impact',
        'Production loss',
        'Equipment damage'
      ],
      safeguards: [
        'Alarm system',
        'Safety valve',
        'Emergency shutdown',
        'Operator intervention'
      ],
      recommendations: [
        'Alarm system',
        'Safety valve',
        'Emergency shutdown',
        'Operator intervention'
      ],
      confidence: 0.85
    };

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get HAZOP statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      inProgress,
      completed,
      highRiskItems,
      recentStudies
    ] = await Promise.all([
      HAZOP.countDocuments({ companyId }),
      HAZOP.countDocuments({ companyId, status: 'in_progress' }),
      HAZOP.countDocuments({ companyId, status: 'completed' }),
      HAZOP.aggregate([
        { $match: { companyId: companyId } },
        { $unwind: '$nodes' },
        { $unwind: '$nodes.worksheets' },
        { $match: { 'nodes.worksheets.risk': { $in: ['high', 'very_high'] } } },
        { $count: 'count' }
      ]),
      HAZOP.find({ companyId })
        .populate('facilitator', 'name')
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
        recentStudies
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;