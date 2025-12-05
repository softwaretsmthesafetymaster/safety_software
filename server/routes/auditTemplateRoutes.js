import express from 'express';
import AuditTemplate from '../models/AuditTemplate.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all templates (default + company specific)
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const templates = await AuditTemplate.find({
      $or: [
        { type: 'default' },
        { companyId, type: 'custom' }
      ],
      isActive: true
    }).sort({ type: 1, name: 1 });

    res.json({ templates });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Get template by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    
    const template = await AuditTemplate.findOne({
      _id: id,
      $or: [
        { type: 'default' },
        { companyId }
      ]
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Create custom template
router.post('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const templateData = {
      ...req.body,
      companyId,
      type: 'custom',
      createdBy: req.user._id
    };

    // Generate unique code
    const baseCode = templateData.name.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
    let code = baseCode;
    let counter = 1;
    
    while (await AuditTemplate.findOne({ code })) {
      code = `${baseCode}_${counter}`;
      counter++;
    }
    
    templateData.code = code;
    const template = new AuditTemplate(templateData);
    await template.save();

    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Upload Excel checklist
router.post('/:companyId/:id/upload-checklist', 
  authenticate, 
  checkCompanyAccess, 
  upload.single('file'), 
  async (req, res) => {
  try {
    const { companyId, id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const template = await AuditTemplate.findOne({ _id: id, companyId });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Convert Excel data to checklist format
    const checklist = data.map((row, index) => ({
      id: `EXCEL_${index + 1}`,
      category: row['Category'] || row['category'] || 'General',
      element: row['Element'] || row['element'] || 'Safety Element',
      question: row['Question'] || row['question'] || 'No question provided',
      clause: row['Clause'] || row['clause'] || '',
      legalStandard: row['Legal Standard'] || row['legal_standard'] || template.standard,
      responseType: 'yes_no_na',
      required: true,
      weight: row['Weight'] || row['weight'] || 1
    }));

    template.checklist = checklist;
    await template.save();

    res.json({
      message: 'Checklist uploaded successfully',
      checklistCount: checklist.length,
      template
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update template
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    
    const template = await AuditTemplate.findOneAndUpdate(
      { _id: id, companyId, type: 'custom' },
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'Template not found or not editable' });
    }

    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete custom template
router.delete('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    
    const template = await AuditTemplate.findOneAndUpdate(
      { _id: id, companyId, type: 'custom' },
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'Template not found or not deletable' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize default templates
router.post('/init/default-templates', async (req, res) => {
  try {
    await AuditTemplate.createDefaultTemplates();
    res.json({ message: 'Default templates initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;