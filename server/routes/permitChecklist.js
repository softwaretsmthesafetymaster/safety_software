import express from 'express';
import Checklist from '../models/PermitChecklist.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 🔹 GET: Checklist for a permit type
router.get('/:permitType', authenticate, async (req, res) => {
  try {
    let checklist = await Checklist.findOne({ permitType: req.params.permitType });

    // If checklist doesn't exist, create a new one with default empty arrays
    if (!checklist) {
      checklist = new Checklist({
        permitType: req.params.permitType,
        riskAssociated: ['Risk of injury due to equipment failure',
      'Hazardous environment exposure',
      'Improper handling risk'],
        precautions: ['Ensure all equipment is inspected',
      'Keep fire extinguisher nearby',
      'Follow site-specific safety protocols'],
        ppeRequired: ['Helmet',
      'Safety gloves',
      'Protective eyewear'],
        inspectionChecklist: ['Visual inspection of tools',
      'Confirm isolation of energy sources',
      'Verify communication equipment'],
        rescueTechniques: ['Call emergency team',
      'Use of first aid kit',
      'Evacuation route identified'],
        createdBy: req.user._id // Assuming req.user is populated by your authenticate middleware
      });
      await checklist.save();
      console.log('New checklist created:', checklist);
    }

    res.json({ checklist });
  } catch (error) {
    console.error('Error fetching or creating checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 POST: Create or update checklist
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      permitType,
      riskAssociated = [],
      precautions = [],
      ppeRequired = [],
      inspectionChecklist = [],
      rescueTechniques = []
    } = req.body;

    const updatedChecklist = await Checklist.findOneAndUpdate(
      { permitType },
      {
        permitType,
        riskAssociated,
        precautions,
        ppeRequired,
        inspectionChecklist,
        rescueTechniques,
        createdBy: req.user._id
      },
      { new: true, upsert: true }
    );

    res.json({ checklist: updatedChecklist, message: 'Checklist saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
