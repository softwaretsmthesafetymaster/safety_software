import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
  id: String,
  category: String,
  element: String,
  question: {
    type: String,
    required: true
  },
  clause: String,
  legalStandard: String,
  responseType: {
    type: String,
    enum: ['yes_no_na', 'text', 'number', 'rating'],
    default: 'yes_no_na'
  },
  required: {
    type: Boolean,
    default: true
  },
  weight: {
    type: Number,
    default: 1
  }
});

const auditTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  version: {
    type: String,
    default: '1.0'
  },
  type: {
    type: String,
    enum: ['default', 'custom'],
    required: true
  },
  standard: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function() {
      return this.type === 'custom';
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  categories: [String],
  checklist: [checklistItemSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  metadata: {
    industry: String,
    applicability: [String],
    frequency: String,
    estimatedDuration: Number
  }
}, {
  timestamps: true
});

// Pre-populate default templates
auditTemplateSchema.statics.createDefaultTemplates = async function() {
  const defaultTemplates = [
    {
      name: 'BIS 14489 - Occupational Health & Safety Management',
      code: 'BIS_14489',
      description: 'Bureau of Indian Standards 14489 for Occupational Health and Safety Management Systems',
      type: 'default',
      standard: 'BIS 14489',
      categories: [
        { name: 'General Requirements', weight: 1 },
        { name: 'OH&S Policy', weight: 1 },
        { name: 'Planning', weight: 1 },
        { name: 'Implementation and Operation', weight: 2 },
        { name: 'Checking', weight: 1 },
        { name: 'Management Review', weight: 1 }
      ],
      checklist: [
        {
          id: 'BIS_1',
          category: 'General Requirements',
          element: 'OH&S Management System',
          question: 'Has the organization established and maintained an OH&S management system?',
          clause: '4.1',
          legalStandard: 'BIS 14489:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'BIS_2',
          category: 'OH&S Policy',
          element: 'Policy Statement',
          question: 'Has top management defined and authorized an OH&S policy?',
          clause: '4.2',
          legalStandard: 'BIS 14489:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'BIS_3',
          category: 'Planning',
          element: 'Hazard Identification',
          question: 'Are procedures established for ongoing hazard identification and risk assessment?',
          clause: '4.3.1',
          legalStandard: 'BIS 14489:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'BIS_4',
          category: 'Implementation and Operation',
          element: 'Training and Competence',
          question: 'Are training needs identified and training provided to ensure competence?',
          clause: '4.4.2',
          legalStandard: 'BIS 14489:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'BIS_5',
          category: 'Checking',
          element: 'Performance Monitoring',
          question: 'Are procedures established for monitoring and measuring OH&S performance?',
          clause: '4.5.1',
          legalStandard: 'BIS 14489:2018',
          responseType: 'yes_no_na'
        }
      ],
      tags: ['safety', 'occupational-health', 'bis', 'indian-standard'],
      metadata: {
        industry: 'General',
        applicability: ['Manufacturing', 'Construction', 'Services'],
        frequency: 'Annual',
        estimatedDuration: 480
      }
    },
    {
      name: 'Fire Safety Audit',
      code: 'FIRE_SAFETY',
      description: 'Comprehensive fire safety management system audit',
      type: 'default',
      standard: 'NBC & Local Fire Code',
      categories: [
        { name: 'Fire Prevention', weight: 2 },
        { name: 'Fire Detection & Alarm', weight: 2 },
        { name: 'Fire Suppression', weight: 2 },
        { name: 'Emergency Evacuation', weight: 2 },
        { name: 'Training & Awareness', weight: 1 },
        { name: 'Maintenance & Testing', weight: 1 }
      ],
      checklist: [
        {
          id: 'FS_1',
          category: 'Fire Prevention',
          element: 'Housekeeping',
          question: 'Are combustible materials properly stored and housekeeping maintained?',
          clause: 'NBC 2016 Part 4',
          legalStandard: 'National Building Code 2016',
          responseType: 'yes_no_na'
        },
        {
          id: 'FS_2',
          category: 'Fire Detection & Alarm',
          element: 'Fire Alarm System',
          question: 'Is an appropriate fire alarm system installed and functional?',
          clause: 'NBC 2016 Part 4',
          legalStandard: 'National Building Code 2016',
          responseType: 'yes_no_na'
        },
        {
          id: 'FS_3',
          category: 'Fire Suppression',
          element: 'Fire Extinguishers',
          question: 'Are portable fire extinguishers provided and properly maintained?',
          clause: 'IS 2190',
          legalStandard: 'Indian Standard 2190',
          responseType: 'yes_no_na'
        },
        {
          id: 'FS_4',
          category: 'Emergency Evacuation',
          element: 'Exit Routes',
          question: 'Are emergency exit routes clearly marked and unobstructed?',
          clause: 'NBC 2016 Part 4',
          legalStandard: 'National Building Code 2016',
          responseType: 'yes_no_na'
        },
        {
          id: 'FS_5',
          category: 'Training & Awareness',
          element: 'Fire Safety Training',
          question: 'Are employees trained in fire safety procedures and evacuation?',
          clause: 'Factory Act 1948',
          legalStandard: 'Factory Act 1948',
          responseType: 'yes_no_na'
        }
      ],
      tags: ['fire-safety', 'emergency', 'prevention'],
      metadata: {
        industry: 'General',
        applicability: ['All Industries'],
        frequency: 'Semi-Annual',
        estimatedDuration: 240
      }
    },
    {
      name: 'Electrical Safety Audit',
      code: 'ELECTRICAL_SAFETY',
      description: 'Electrical safety compliance and hazard assessment audit',
      type: 'default',
      standard: 'IS 732 & CEA Regulations',
      categories: [
        { name: 'Electrical Installation', weight: 2 },
        { name: 'Earthing & Protection', weight: 2 },
        { name: 'Electrical Equipment', weight: 2 },
        { name: 'Safe Work Practices', weight: 1 },
        { name: 'Training & Competency', weight: 1 }
      ],
      checklist: [
        {
          id: 'ES_1',
          category: 'Electrical Installation',
          element: 'Wiring System',
          question: 'Is the electrical wiring system installed as per IS 732?',
          clause: 'IS 732:2019',
          legalStandard: 'Indian Standard 732:2019',
          responseType: 'yes_no_na'
        },
        {
          id: 'ES_2',
          category: 'Earthing & Protection',
          element: 'Earthing System',
          question: 'Is proper earthing system installed and maintained?',
          clause: 'Rule 61 CEA',
          legalStandard: 'Central Electricity Authority Rules',
          responseType: 'yes_no_na'
        },
        {
          id: 'ES_3',
          category: 'Electrical Equipment',
          element: 'Equipment Safety',
          question: 'Are electrical equipment properly guarded and maintained?',
          clause: 'IS 732:2019',
          legalStandard: 'Indian Standard 732:2019',
          responseType: 'yes_no_na'
        },
        {
          id: 'ES_4',
          category: 'Safe Work Practices',
          element: 'LOTO Procedures',
          question: 'Are lockout/tagout procedures implemented for electrical work?',
          clause: 'Factory Act 1948',
          legalStandard: 'Factory Act 1948',
          responseType: 'yes_no_na'
        },
        {
          id: 'ES_5',
          category: 'Training & Competency',
          element: 'Electrical Training',
          question: 'Are electrical workers trained and certified for their tasks?',
          clause: 'CEA Regulations',
          legalStandard: 'Central Electricity Authority',
          responseType: 'yes_no_na'
        }
      ],
      tags: ['electrical-safety', 'installation', 'protection'],
      metadata: {
        industry: 'General',
        applicability: ['Manufacturing', 'Commercial', 'Industrial'],
        frequency: 'Annual',
        estimatedDuration: 360
      }
    },
    {
      name: 'ISO 45001:2018 - Occupational Health & Safety',
      code: 'ISO_45001',
      description: 'ISO 45001:2018 Occupational Health and Safety Management Systems audit',
      type: 'default',
      standard: 'ISO 45001:2018',
      categories: [
        { name: 'Context of Organization', weight: 1 },
        { name: 'Leadership', weight: 2 },
        { name: 'Planning', weight: 2 },
        { name: 'Support', weight: 2 },
        { name: 'Operation', weight: 2 },
        { name: 'Performance Evaluation', weight: 1 },
        { name: 'Improvement', weight: 1 }
      ],
      checklist: [
        {
          id: 'ISO_1',
          category: 'Context of Organization',
          element: 'Understanding Organization',
          question: 'Has the organization determined internal and external issues relevant to OH&S?',
          clause: '4.1',
          legalStandard: 'ISO 45001:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'ISO_2',
          category: 'Leadership',
          element: 'Leadership and Commitment',
          question: 'Does top management demonstrate leadership and commitment to OH&S?',
          clause: '5.1',
          legalStandard: 'ISO 45001:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'ISO_3',
          category: 'Planning',
          element: 'Hazard Identification',
          question: 'Are processes established for hazard identification and risk assessment?',
          clause: '6.1.2',
          legalStandard: 'ISO 45001:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'ISO_4',
          category: 'Support',
          element: 'Competence',
          question: 'Has the organization determined competence requirements for workers?',
          clause: '7.2',
          legalStandard: 'ISO 45001:2018',
          responseType: 'yes_no_na'
        },
        {
          id: 'ISO_5',
          category: 'Operation',
          element: 'Operational Planning',
          question: 'Are operational controls established to eliminate hazards and reduce risks?',
          clause: '8.1',
          legalStandard: 'ISO 45001:2018',
          responseType: 'yes_no_na'
        }
      ],
      tags: ['iso-45001', 'occupational-health', 'safety-management'],
      metadata: {
        industry: 'General',
        applicability: ['All Industries'],
        frequency: 'Annual',
        estimatedDuration: 480
      }
    },
    {
      name: 'Process Safety Management (PSM)',
      code: 'PSM_AUDIT',
      description: 'Process Safety Management audit for chemical and process industries',
      type: 'default',
      standard: 'OSHA PSM / CCPS Guidelines',
      categories: [
        { name: 'Process Safety Information', weight: 2 },
        { name: 'Process Hazard Analysis', weight: 2 },
        { name: 'Operating Procedures', weight: 2 },
        { name: 'Training', weight: 1 },
        { name: 'Contractors', weight: 1 },
        { name: 'Pre-startup Safety Review', weight: 1 },
        { name: 'Mechanical Integrity', weight: 2 },
        { name: 'Management of Change', weight: 2 },
        { name: 'Incident Investigation', weight: 1 },
        { name: 'Emergency Planning', weight: 1 }
      ],
      checklist: [
        {
          id: 'PSM_1',
          category: 'Process Safety Information',
          element: 'Chemical Information',
          question: 'Is complete chemical information available for all hazardous chemicals?',
          clause: '29 CFR 1910.119(d)',
          legalStandard: 'OSHA PSM Standard',
          responseType: 'yes_no_na'
        },
        {
          id: 'PSM_2',
          category: 'Process Hazard Analysis',
          element: 'PHA Methodology',
          question: 'Has a systematic process hazard analysis been conducted?',
          clause: '29 CFR 1910.119(e)',
          legalStandard: 'OSHA PSM Standard',
          responseType: 'yes_no_na'
        },
        {
          id: 'PSM_3',
          category: 'Operating Procedures',
          element: 'Written Procedures',
          question: 'Are written operating procedures available for each process?',
          clause: '29 CFR 1910.119(f)',
          legalStandard: 'OSHA PSM Standard',
          responseType: 'yes_no_na'
        },
        {
          id: 'PSM_4',
          category: 'Training',
          element: 'Initial Training',
          question: 'Do employees receive initial training in process operations?',
          clause: '29 CFR 1910.119(g)',
          legalStandard: 'OSHA PSM Standard',
          responseType: 'yes_no_na'
        },
        {
          id: 'PSM_5',
          category: 'Mechanical Integrity',
          element: 'Equipment Inspection',
          question: 'Are pressure vessels and piping systems inspected and tested?',
          clause: '29 CFR 1910.119(j)',
          legalStandard: 'OSHA PSM Standard',
          responseType: 'yes_no_na'
        }
      ],
      tags: ['process-safety', 'chemical', 'hazard-analysis'],
      metadata: {
        industry: 'Chemical & Process',
        applicability: ['Chemical', 'Petrochemical', 'Oil & Gas'],
        frequency: 'Annual',
        estimatedDuration: 720
      }
    },
    {
      name: 'AI Safety Audit',
      code: 'AI_SAFETY',
      description: 'AI-powered comprehensive safety audit with intelligent risk assessment',
      type: 'default',
      standard: 'AI-Enhanced Safety Framework',
      categories: [
        { name: 'AI Risk Assessment', weight: 2 },
        { name: 'Predictive Safety Analysis', weight: 2 },
        { name: 'Automated Compliance Check', weight: 2 },
        { name: 'Intelligent Monitoring', weight: 1 },
        { name: 'AI-Driven Recommendations', weight: 1 }
      ],
      checklist: [
        {
          id: 'AI_1',
          category: 'AI Risk Assessment',
          element: 'Risk Prediction',
          question: 'Are AI algorithms used for predictive risk assessment?',
          clause: 'AI Safety Framework 1.0',
          legalStandard: 'AI Safety Standards',
          responseType: 'yes_no_na'
        },
        {
          id: 'AI_2',
          category: 'Predictive Safety Analysis',
          element: 'Anomaly Detection',
          question: 'Is AI-based anomaly detection system implemented for safety monitoring?',
          clause: 'AI Safety Framework 2.0',
          legalStandard: 'AI Safety Standards',
          responseType: 'yes_no_na'
        },
        {
          id: 'AI_3',
          category: 'Automated Compliance Check',
          element: 'Compliance Monitoring',
          question: 'Are automated systems in place for continuous compliance monitoring?',
          clause: 'AI Safety Framework 3.0',
          legalStandard: 'AI Safety Standards',
          responseType: 'yes_no_na'
        },
        {
          id: 'AI_4',
          category: 'Intelligent Monitoring',
          element: 'Real-time Analysis',
          question: 'Is real-time safety data analysis implemented using AI?',
          clause: 'AI Safety Framework 4.0',
          legalStandard: 'AI Safety Standards',
          responseType: 'yes_no_na'
        },
        {
          id: 'AI_5',
          category: 'AI-Driven Recommendations',
          element: 'Smart Recommendations',
          question: 'Does the system provide AI-driven safety improvement recommendations?',
          clause: 'AI Safety Framework 5.0',
          legalStandard: 'AI Safety Standards',
          responseType: 'yes_no_na'
        }
      ],
      tags: ['ai-safety', 'predictive', 'intelligent'],
      metadata: {
        industry: 'Technology Enhanced',
        applicability: ['Smart Manufacturing', 'Industry 4.0'],
        frequency: 'Continuous',
        estimatedDuration: 360
      }
    }
  ];

  for (const template of defaultTemplates) {
    await this.findOneAndUpdate(
      { code: template.code },
      template,
      { upsert: true, new: true }
    );
  }
};

export default mongoose.model('AuditTemplate', auditTemplateSchema);