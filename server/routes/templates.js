import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import ChecklistTemplate from '../models/ChecklistTemplate.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Default templates data
const defaultTemplates = [
  {
    name: 'BIS 14489 - Occupational Health & Safety Management',
    code: 'BIS14489',
    standard: 'BIS14489',
    description: 'Bureau of Indian Standards for Occupational Health & Safety Management Systems',
    categories: [
      {
        name: 'Policy and Planning',
        questions: [
          { id: 'BIS_1_1', question: 'Is there a documented OH&S policy approved by top management?', clause: '4.2', element: 'Policy' },
          { id: 'BIS_1_2', question: 'Are OH&S objectives and targets established and documented?', clause: '4.3.3', element: 'Objectives' },
          { id: 'BIS_1_3', question: 'Is there a documented OH&S management program?', clause: '4.3.4', element: 'Program' }
        ]
      },
      {
        name: 'Implementation and Operation',
        questions: [
          { id: 'BIS_2_1', question: 'Are roles and responsibilities for OH&S clearly defined?', clause: '4.4.1', element: 'Responsibility' },
          { id: 'BIS_2_2', question: 'Is OH&S training provided to all employees?', clause: '4.4.2', element: 'Training' },
          { id: 'BIS_2_3', question: 'Are hazard identification and risk assessment procedures established?', clause: '4.3.1', element: 'Hazard ID' }
        ]
      }
    ]
  },

  // FIRE SAFETY
  {
    name: 'Fire Safety Audit',
    code: 'FIRE_SAFETY',
    standard: 'FireSafety',
    description: 'Comprehensive fire safety management audit checklist',
    categories: [
      {
        name: 'Fire Prevention Systems',
        questions: [
          { id: 'FS_1_1', question: 'Are fire extinguishers properly installed and maintained?', clause: '4.2.1', element: 'Fire Equipment' },
          { id: 'FS_1_2', question: 'Is the fire alarm system functional and tested regularly?', clause: '4.2.2', element: 'Alarm System' },
          { id: 'FS_1_3', question: 'Are emergency exits clearly marked and unobstructed?', clause: '4.2.3', element: 'Emergency Exits' }
        ]
      },
      {
        name: 'Fire Detection and Suppression',
        questions: [
          { id: 'FS_2_1', question: 'Are smoke detectors installed and functioning properly?', clause: '4.3.1', element: 'Detection System' },
          { id: 'FS_2_2', question: 'Is the sprinkler system operational and regularly tested?', clause: '4.3.2', element: 'Suppression System' },
          { id: 'FS_2_3', question: 'Are fire hydrants accessible and in working condition?', clause: '4.3.3', element: 'Hydrant System' }
        ]
      }
    ]
  },

  // ELECTRICAL SAFETY
  {
    name: 'Electrical Safety Audit',
    code: 'ELECTRICAL_SAFETY',
    standard: 'ElectricalSafety',
    description: 'Electrical safety compliance and hazard assessment',
    categories: [
      {
        name: 'Electrical Installation',
        questions: [
          { id: 'ES_1_1', question: 'Are all electrical installations compliant with local codes?', clause: '6.1.1', element: 'Installation' },
          { id: 'ES_1_2', question: 'Is proper earthing/grounding provided for all equipment?', clause: '6.1.2', element: 'Grounding' },
          { id: 'ES_1_3', question: 'Are electrical panels properly labeled and accessible?', clause: '6.1.3', element: 'Panels' }
        ]
      },
      {
        name: 'Electrical Safety Measures',
        questions: [
          { id: 'ES_2_1', question: 'Are GFCI/RCD devices installed where required?', clause: '6.2.1', element: 'Protection Devices' },
          { id: 'ES_2_2', question: 'Is lockout/tagout procedure implemented for electrical work?', clause: '6.2.2', element: 'LOTO' },
          { id: 'ES_2_3', question: 'Are electrical workers trained and certified?', clause: '6.2.3', element: 'Training' }
        ]
      }
    ]
  },

  // ISO 45001
  {
    name: 'ISO 45001:2018 - Occupational Health & Safety',
    code: 'ISO45001',
    standard: 'ISO45001',
    description: 'International standard for occupational health and safety management systems',
    categories: [
      {
        name: 'Context and Leadership',
        questions: [
          { id: 'ISO_1_1', question: 'Has the organization determined internal and external issues?', clause: '4.1', element: 'Context' },
          { id: 'ISO_1_2', question: 'Is top management demonstrating leadership and commitment?', clause: '5.1', element: 'Leadership' },
          { id: 'ISO_1_3', question: 'Is the OH&S policy established and communicated?', clause: '5.2', element: 'Policy' }
        ]
      },
      {
        name: 'Planning and Support',
        questions: [
          { id: 'ISO_2_1', question: 'Are hazards identified and OH&S risks assessed?', clause: '6.1.2', element: 'Risk Assessment' },
          { id: 'ISO_2_2', question: 'Are OH&S objectives established and planned?', clause: '6.2', element: 'Objectives' },
          { id: 'ISO_2_3', question: 'Are competence requirements determined and training provided?', clause: '7.2', element: 'Competence' }
        ]
      }
    ]
  },

  // PSM
  {
    name: 'Process Safety Management (PSM)',
    code: 'PSM',
    standard: 'PSM',
    description: 'Process safety management for chemical and industrial processes',
    categories: [
      {
        name: 'Process Safety Information',
        questions: [
          { id: 'PSM_1_1', question: 'Is process safety information documented and current?', clause: '3.1.1', element: 'PSI' },
          { id: 'PSM_1_2', question: 'Are process hazard analyses conducted and updated?', clause: '3.1.2', element: 'PHA' },
          { id: 'PSM_1_3', question: 'Are operating procedures written and followed?', clause: '3.1.3', element: 'Procedures' }
        ]
      },
      {
        name: 'Emergency Planning',
        questions: [
          { id: 'PSM_2_1', question: 'Is an emergency action plan developed and implemented?', clause: '3.2.1', element: 'Emergency Plan' },
          { id: 'PSM_2_2', question: 'Are emergency response drills conducted regularly?', clause: '3.2.2', element: 'Drills' },
          { id: 'PSM_2_3', question: 'Is incident investigation procedure established?', clause: '3.2.3', element: 'Investigation' }
        ]
      }
    ]
  },

  // AI SAFETY
  {
    name: 'AI Safety Audit',
    code: 'AI_SAFETY',
    standard: 'AISafety',
    description: 'Artificial Intelligence safety and ethical compliance audit',
    categories: [
      {
        name: 'AI Governance',
        questions: [
          { id: 'AI_1_1', question: 'Is there an AI governance framework in place?', clause: '8.1.1', element: 'Governance' },
          { id: 'AI_1_2', question: 'Are AI systems regularly monitored for bias and fairness?', clause: '8.1.2', element: 'Bias Monitoring' },
          { id: 'AI_1_3', question: 'Is there transparency in AI decision-making processes?', clause: '8.1.3', element: 'Transparency' }
        ]
      },
      {
        name: 'Data Security and Privacy',
        questions: [
          { id: 'AI_2_1', question: 'Are data privacy measures implemented for AI systems?', clause: '8.2.1', element: 'Privacy' },
          { id: 'AI_2_2', question: 'Is data used for AI training properly secured?', clause: '8.2.2', element: 'Data Security' },
          { id: 'AI_2_3', question: 'Are AI model outputs validated and verified?', clause: '8.2.3', element: 'Validation' }
        ]
      }
    ]
  }
];



// Initialize default templates
router.post('/initialize-defaults/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    for (const templateData of defaultTemplates) {
      const existingTemplate = await ChecklistTemplate.findOne({ 
        companyId, 
        code: templateData.code 
      });
      
      if (!existingTemplate) {
        const template = new ChecklistTemplate({
          ...templateData,
          companyId,
          isDefault: true,
          createdBy: req.user._id
        });
        await template.save();
      }
    }
    
    res.json({ message: 'Default templates initialized successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Get all templates
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { standard, isActive = true } = req.query;
    
    const filter = { companyId, isActive };
    if (standard) filter.standard = standard;
    
    const templates = await ChecklistTemplate.find(filter)
      .populate('createdBy', 'name')
      .populate('lastModifiedBy', 'name')
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get template by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    
    const template = await ChecklistTemplate.findOne({ _id: id, companyId })
      .populate('createdBy', 'name')
      .populate('lastModifiedBy', 'name');
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({ template });
  } catch (error) {
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
      createdBy: req.user._id,
      isDefault: false
    };
    const template = new ChecklistTemplate(templateData);
    await template.save();
    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.log("Error in Creating Template: ",error)
    res.status(500).json({ message: error.message });
  }
});

// Update template
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = {
      ...req.body,
      lastModifiedBy: req.user._id
    };
    
    const template = await ChecklistTemplate.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload Excel template
router.post('/:companyId/upload', authenticate, checkCompanyAccess, upload.single('template'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, standard, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    // Process Excel data into template format
    const categories = {};
    
    data.forEach((row, index) => {
      const category = row.Category || 'General';
      const question = row.Question || row.question;
      const clause = row.Clause || row.clause || '';
      const element = row.Element || row.element || '';
      const legalStandard = row['Legal Standard'] || row.legalStandard || '';
      
      if (!question) return;
      
      if (!categories[category]) {
        categories[category] = {
          name: category,
          questions: []
        };
      }
      
      categories[category].questions.push({
        id: `Q_${index + 1}`,
        question: question.toString(),
        clause,
        element,
        legalStandard,
        isRequired: true,
        answerType: 'yes_no_na'
      });
    });
    
    const template = new ChecklistTemplate({
      companyId,
      name,
      code: `CUSTOM_${Date.now()}`,
      standard: standard || 'custom',
      description,
      categories: Object.values(categories),
      isDefault: false,
      createdBy: req.user._id,
      // uploadedFile: {
      //   filename: req.file.filename,
      //   originalName: req.file.originalname,
      //   path: req.file.path,
      //   uploadDate: new Date()
      // }
    });
    
    await template.save();
    
    res.status(201).json({
      message: 'Template uploaded and created successfully',
      template
    });
  } catch (error) {
    console.log("Error in uploading :",error)
    res.status(500).json({ message: error.message });
  }
});

// Delete template
router.delete('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    
    const template = await ChecklistTemplate.findOne({ _id: id, companyId });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    if (template.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default template' });
    }
    
    await ChecklistTemplate.findByIdAndDelete(id);
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;