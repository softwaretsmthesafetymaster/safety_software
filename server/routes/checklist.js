import express from 'express';
import ChecklistTemplate from '../models/ChecklistTemplate.js';
import Audit from '../models/Audit.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';

const router = express.Router();

// Get checklist templates
router.get('/templates/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const templates = await ChecklistTemplate.find({ companyId, isActive: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create checklist template
router.post('/templates/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const templateData = {
      ...req.body,
      companyId,
      createdBy: req.user._id
    };

    const template = new ChecklistTemplate(templateData);
    await template.save();

    res.status(201).json({
      message: 'Checklist template created successfully',
      template
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get audit checklist
router.get('/:companyId/audit/:auditId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    
    const { companyId, auditId } = req.params;
    const audit = await Audit.findOne({ _id: auditId, companyId })
      .populate('templateId')
      .populate('checklist.completedBy', 'name');

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({ 
      audit: {
        _id: audit._id,
        title: audit.title,
        checklist: audit.checklist,
        checklistTemplate: audit.templateId,
        summary: audit.summary,
        status: audit.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update checklist answers
router.patch('/:companyId/audit/:auditId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, auditId } = req.params;
    const { checklist } = req.body;

    const audit = await Audit.findOne({ _id: auditId, companyId });
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    // Update checklist with answers
    audit.checklist = checklist.map(item => ({
      ...item,
      completedBy: req.user._id,
      completedAt: item.answer ? new Date() : item.completedAt
    }));

    await audit.save();

    res.json({
      message: 'Checklist updated successfully',
      audit: {
        _id: audit._id,
        checklist: audit.checklist,
        summary: audit.summary,
        status: audit.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize checklist from template
router.post('/:companyId/audit/:auditId/initialize', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, auditId } = req.params;
   console.log("req.body", req.body);
    const { templateId } = req.body;
    const [audit, template] = await Promise.all([
      Audit.findOne({ _id: auditId, companyId }),
      ChecklistTemplate.findOne({ _id: templateId.toString(), companyId })
    ]);

    if (!audit || !template) {
      return res.status(404).json({ message: 'Audit or template not found' });
    }

    // Initialize checklist from template
    audit.checklistTemplateId = templateId;
    audit.checklist = [];

    template.categories.forEach(category => {
      category.questions.forEach(question => {
        audit.checklist.push({
          categoryId: category._id?.toString() || category.name,
          categoryName: category.name,
          questionId: question.id,
          question: question.question,
          clause: question.clause,
          answer: null,
          remarks: '',
          evidence: '',
          photos: []
        });
      });
    });

    await audit.save();

    res.json({
      message: 'Checklist initialized successfully',
      audit: {
        _id: audit._id,
        checklist: audit.checklist,
        checklistTemplate: template
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;