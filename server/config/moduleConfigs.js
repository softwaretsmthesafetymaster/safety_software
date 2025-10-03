const moduleConfigs = {
  ptw: {
    default: {
      approvalFlow: [
        { role: 'hod', label: 'HOD Approval', step: 1 },
        { role: 'safety_incharge', label: 'Safety Approval', step: 2 }
      ],
      areaApproverRoles: [
        { role: 'hod', label: 'Primary HOD', type: 'single' },
        { role: 'safety_incharge', label: 'Safety Officer', type: 'single' }
      ],
      highRiskApprovalFlow: [
        { role: 'plant_head', label: 'Plant Head Initial Approval', step: 1 },
        { role: 'hod', label: 'HOD Approval', step: 2 },
        { role: 'safety_incharge', label: 'Safety Approval', step: 3 }
      ],
      closureFlow: {
        anyOf: ['hod', 'safety_incharge', 'plant_head'],
        label: 'Closure Approval'
      },
      extensionFlow: [
        { role: 'hod', label: 'HOD Extension Approval', step: 1 },
        { role: 'safety_incharge', label: 'Safety Extension Approval', step: 2 }
      ],
      stopWorkRoles: [
        { role: 'hod', label: 'HOD Stop Work' },
        { role: 'safety_incharge', label: 'Safety Stop Work' },
        { role: 'plant_head', label: 'Plant Head Stop Work' }
      ],
      roles: ['worker', 'contractor', 'hod', 'safety_incharge', 'plant_head', 'company_owner'],
      statusMap: {
        draft: 'draft',
        submitted: 'pending-hod',
        pendingSafety: 'pending-safety',
        pendingPlantHead: 'pending-plant-head',
        approved: 'approved',
        active: 'active',
        rejected: 'rejected',
        closurePending: 'closure-pending',
        closureRejected: 'closure-rejected',
        closed: 'closed',
        extensionPending: 'extension-pending',
        extensionRejected: 'extension-rejected',
        expired: 'expired',
        stopped: 'stopped'
      },
      checklists: {
        hotWork: [
          'Fire watch posted',
          'Hot work permit displayed',
          'Fire extinguisher available',
          'Area cleared of combustibles',
          'Welding screens in place'
        ],
        coldWork: [
          'Area isolated',
          'Tools inspected',
          'PPE verified',
          'Emergency contacts available'
        ],
        confinedSpace: [
          'Atmospheric testing completed',
          'Ventilation adequate',
          'Entry supervisor assigned',
          'Rescue plan in place',
          'Communication established'
        ],
        workingAtHeight: [
          'Fall protection system inspected',
          'Anchor points verified',
          'Weather conditions acceptable',
          'Rescue plan available'
        ],
        electrical: [
          'LOTO procedures followed',
          'Electrical isolation verified',
          'Testing equipment calibrated',
          'Qualified electrician present'
        ],
        excavation: [
          'Underground utilities located',
          'Soil conditions assessed',
          'Shoring/sloping adequate',
          'Entry/exit routes clear'
        ]
      }
    }
  },

  ims: {
    default: {
      reportingFlow: [
        { role: 'worker', label: 'Incident Report', step: 1 }
      ],
      investigationFlow: [
        { anyOf: ['hod', 'admin'], label: 'Assign Investigation Team', step: 1 },
        { role: 'investigation_team', label: 'Root Cause Analysis (RCA)', step: 2 },
        { role: 'investigation_team', label: 'Assign Responsible Person (any user)', step: 3 }
      ],
      recommendationFlow: [
        { role: 'dynamic', label: 'Complete Recommendation & Upload Proof', step: 1 }, // dynamic = selected user
        { anyOf: ['hod', 'admin', 'investigation_team'], label: 'Approve/Reject Recommendation', step: 2 }
      ],
      closureFlow: {
        anyOf: ['hod', 'admin', 'investigation_team'],
        label: 'Incident Closure'
      },
      severityEscalation: {
        low: ['hod'],
        medium: ['hod', 'admin'],
        high: ['hod', 'admin', 'plant_head'],
        critical: ['hod', 'admin', 'plant_head', 'company_owner']
      },
      roles: [
        'worker',
        'contractor',
        'hod',
        'admin',
        'investigation_team',
        'plant_head',
        'company_owner'
      ],
      statusMap: {
        open: 'open',
        reviewing: 'under-review',
        investigating: 'investigating',
        actionPending: 'recommendation-pending',
        actionReview: 'recommendation-review',
        pendingClosure: 'pending-closure',
        closed: 'closed',
        reassigned: 'reassigned'
      }
    }
  },

  hazop: {
    default: {
      teamRoles: {
        chairman: ['safety_incharge', 'plant_head'],
        scribe: ['safety_incharge', 'hod'],
        facilitator: ['safety_incharge', 'plant_head'],
        members: ['hod', 'safety_incharge', 'contractor', 'worker']
      },
      studyFlow: [
        { role: 'facilitator', label: 'Study Creation', step: 1 },
        { role: 'team', label: 'Node Development', step: 2 },
        { role: 'team', label: 'Worksheet Analysis', step: 3 },
        { role: 'chairman', label: 'Study Closure', step: 4 }
      ],
      riskMatrix: {
        likelihood: ['rare', 'unlikely', 'possible', 'likely', 'almost_certain'],
        severity: ['negligible', 'minor', 'moderate', 'major', 'catastrophic'],
        riskLevels: {
          1: 'very_low',
          2: 'very_low',
          3: 'low',
          4: 'low',
          5: 'low',
          6: 'medium',
          7: 'medium',
          8: 'medium',
          9: 'medium',
          10: 'medium',
          15: 'high',
          20: 'high',
          25: 'very_high'
        }
      },
      roles: ['hod', 'safety_incharge', 'plant_head', 'contractor', 'worker'],
      statusMap: {
        planned: 'planned',
        inProgress: 'in-progress',
        completed: 'completed',
        closed: 'closed'
      }
    }
  },

  hira: {
    default: {
      assessmentFlow: [
        { role: 'assessor', label: 'Assessment Creation', step: 1 },
        { role: 'team', label: 'Hazard Identification', step: 2 },
        { role: 'team', label: 'Risk Assessment', step: 3 },
        { role: 'safety_incharge', label: 'Review & Approval', step: 4 }
      ],
      riskScoring: {
        probability: { min: 1, max: 5 },
        severity: { min: 1, max: 5 },
        exposure: { min: 1, max: 5 }
      },
      acceptabilityLevels: {
        acceptable: { max: 30 },
        tolerable: { min: 31, max: 90 },
        unacceptable: { min: 91 }
      },
      roles: ['worker', 'hod', 'safety_incharge', 'plant_head'],
      statusMap: {
        draft: 'draft',
        assigned: 'assigned',
        inProgress: 'in-progress',
        completed: 'completed',
        approved: 'approved',
        rejected: 'rejected',
        closed: 'closed'
      }
    }
  },

  bbs: {
    default: {
      observationFlow: [
        { role: 'observer', label: 'Observation Report', step: 1 },
        { role: 'hod', label: 'HOD Review', step: 2 },
        { role: 'safety_incharge', label: 'Safety Review', step: 3 }
      ],
      actionFlow: [
        { role: 'assignee', label: 'Action Execution', step: 1 },
        { role: 'hod', label: 'Action Review', step: 2 },
        { role: 'safety_incharge', label: 'Final Approval', step: 3 }
      ],
      categories: {
        unsafeActs: [
          'PPE not used',
          'Wrong procedure',
          'Unsafe position',
          'Operating without authority',
          'Operating at unsafe speed',
          'Making safety devices inoperative'
        ],
        unsafeConditions: [
          'Defective equipment',
          'Inadequate guards/barriers',
          'Defective PPE',
          'Poor housekeeping',
          'Hazardous environmental conditions',
          'Inadequate warning systems'
        ],
        safeBehaviors: [
          'Proper PPE usage',
          'Following procedures',
          'Good housekeeping',
          'Safety awareness',
          'Proactive safety behavior',
          'Helping others with safety'
        ]
      },
      roles: ['worker', 'contractor', 'hod', 'safety_incharge', 'plant_head'],
      statusMap: {
        open: 'open',
        reviewing: 'under-review',
        approved: 'approved',
        pendingClosure: 'pending-closure',
        closed: 'closed',
        reassigned: 'reassigned'
      }
    }
  },

  audit: {
    default: {
      auditFlow: [
        { role: 'auditor', label: 'Audit Planning', step: 1 },
        { role: 'audit_team', label: 'Audit Execution', step: 2 },
        { role: 'auditor', label: 'Findings Documentation', step: 3 },
        { role: 'safety_incharge', label: 'Review & Closure', step: 4 }
      ],
      observationFlow: [
        { role: 'assignee', label: 'Action Implementation', step: 1 },
        { role: 'auditor', label: 'Verification', step: 2 },
        { role: 'safety_incharge', label: 'Final Approval', step: 3 }
      ],
      standards: ['ISO45001', 'ISO14001', 'OHSAS18001', 'custom'],
      findingTypes: ['non_compliance', 'observation', 'opportunity'],
      severityLevels: ['minor', 'major', 'critical'],
      roles: ['auditor', 'hod', 'safety_incharge', 'plant_head'],
      statusMap: {
        planned: 'planned',
        inProgress: 'in-progress',
        completed: 'completed',
        closed: 'closed'
      }
    }
  }
};

export default moduleConfigs;