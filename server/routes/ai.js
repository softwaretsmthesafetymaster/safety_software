import express from 'express';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import AIService from '../services/aiService.js';

const router = express.Router();

// HAZOP AI Suggestions
router.post('/:companyId/hazop/suggestions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { parameter, guideWord, process, context } = req.body;
    
    const suggestions = await AIService.getHAZOPSuggestions(parameter, guideWord, process, context);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('HAZOP AI suggestions error:', error);
    res.status(500).json({ message: 'Failed to get AI suggestions' });
  }
});

// HIRA AI Suggestions
router.post('/:companyId/hira/suggestions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { hazard, category, activity, context } = req.body;
    
    const suggestions = await AIService.getHIRASuggestions(hazard, category, activity, context);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('HIRA AI suggestions error:', error);
    res.status(500).json({ message: 'Failed to get AI suggestions' });
  }
});

// Incident RCA AI Suggestions
router.post('/:companyId/incident/rca-suggestions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { incident, context } = req.body;
    
    const suggestions = await AIService.getRCASuggestions(incident, context);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('RCA AI suggestions error:', error);
    res.status(500).json({ message: 'Failed to get RCA suggestions' });
  }
});

// Audit AI Suggestions
router.post('/:companyId/audit/suggestions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { finding, standard, context } = req.body;
    
    const suggestions = await AIService.getAuditSuggestions(finding, standard, context);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Audit AI suggestions error:', error);
    res.status(500).json({ message: 'Failed to get AI suggestions' });
  }
});

// General risk assessment AI
router.post('/:companyId/risk-assessment', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { riskData, context } = req.body;
    
    // Mock risk assessment - replace with actual AI service
    const assessment = {
      riskLevel: 'Medium',
      recommendations: [
        'Implement additional safety controls',
        'Provide enhanced training',
        'Increase monitoring frequency',
        'Review emergency procedures'
      ],
      mitigationStrategies: [
        'Engineering controls',
        'Administrative controls',
        'Personal protective equipment',
        'Training and awareness'
      ],
      confidence: 0.82
    };
    
    res.json({ assessment });
  } catch (error) {
    console.error('Risk assessment AI error:', error);
    res.status(500).json({ message: 'Failed to perform risk assessment' });
  }
});

export default router;