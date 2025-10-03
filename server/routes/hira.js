import express from 'express';
import HIRA from '../models/HIRA.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from 'docx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';

const router = express.Router();

// Initialize Gemini AI
const modelName = 'gemini-1.5-flash'; // stable version
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// GET: Dashboard statistics
router.get('/:companyId/dashboard',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      
      const [
        totalAssessments,
        draftAssessments,
        assignedAssessments,
        inProgressAssessments,
        completedAssessments,
        approvedAssessments,
        rejectedAssessments,
        closedAssessments,
        highRiskItems,
        recentAssessments
      ] = await Promise.all([
        HIRA.countDocuments({ companyId }),
        HIRA.countDocuments({ companyId, status: 'draft' }),
        HIRA.countDocuments({ companyId, status: 'assigned' }),
        HIRA.countDocuments({ companyId, status: 'in_progress' }),
        HIRA.countDocuments({ companyId, status: 'completed' }),
        HIRA.countDocuments({ companyId, status: 'approved' }),
        HIRA.countDocuments({ companyId, status: 'rejected' }),
        HIRA.countDocuments({ companyId, status: 'closed' }),
        HIRA.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
          { $unwind: '$worksheetRows' },
          { $match: { 'worksheetRows.riskCategory': { $in: ['High', 'Very High'] } } },
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
          totalAssessments,
          draftAssessments,
          assignedAssessments,
          inProgressAssessments,
          completedAssessments,
          approvedAssessments,
          rejectedAssessments,
          closedAssessments,
          highRiskItems: highRiskItems[0]?.count || 0,
          recentAssessments
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// GET: All HIRA assessments
router.get('/:companyId',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, status, plantId, search } = req.query;

      const filter = { companyId: new mongoose.Types.ObjectId(companyId) };
      
      // Role-based filtering
      if (req.user.role !== 'plant_head' && req.user.role !== 'company_owner') {
        // Team members can only see assigned assessments
        filter.$or = [
          { assessor: req.user._id },
          { team: req.user._id }
        ];
      }
      
      if (status) filter.status = status;
      if (plantId) filter.plantId = new mongoose.Types.ObjectId(plantId);
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { assessmentNumber: { $regex: search, $options: 'i' } },
          { process: { $regex: search, $options: 'i' } }
        ];
      }

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
        currentPage: parseInt(page),
        total
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// GET: HIRA assessment by ID
router.get('/:companyId/:id',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const assessment = await HIRA.findOne({ _id: id, companyId })
        .populate('assessor', 'name email role')
        .populate('plantId', 'name code areas')
        .populate('team', 'name role email')
        .populate('approvedBy', 'name email')
        .populate('worksheetRows.actionOwner', 'name email');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }
      
      res.json({ assessment });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: Create HIRA assessment
router.post('/:companyId',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const company = await Company.findById(companyId);
      if (!company) return res.status(404).json({ message: 'Company not found' });

      const hiraConfig = company.config?.hira || {
        statusMap: { draft: 'draft', assigned: 'assigned', inProgress: 'in_progress', completed: 'completed', approved: 'approved' }
      };

      const assessmentData = {
        ...req.body,
        companyId,
        assessor: req.user._id,
        assessmentNumber: await NumberGenerator.generateNumber(companyId, 'hira'),
        status: hiraConfig.statusMap.draft,
        worksheetRows: []
      };

      const assessment = new HIRA(assessmentData);
      await assessment.save();
      
      await assessment.populate('assessor', 'name email');
      await assessment.populate('plantId', 'name code');
      await assessment.populate('team', 'name role email');

      res.status(201).json({
        message: 'HIRA assessment created successfully',
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// PATCH: Update HIRA assessment
router.patch('/:companyId/:id',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const updates = req.body;

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        updates,
        { new: true, runValidators: true }
      )
      .populate('assessor', 'name email')
      .populate('plantId', 'name code')
      .populate('team', 'name role email');

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
  }
);

// POST: Assign HIRA to team
router.post('/:companyId/:id/assign',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { team, comments } = req.body;

      const company = await Company.findById(companyId);
      const hiraConfig = company.config?.hira || { statusMap: { assigned: 'assigned' } };

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        { 
          team,
          status: hiraConfig.statusMap.assigned,
          assignedAt: new Date(),
          approvalComments: comments
        },
        { new: true }
      ).populate('team', 'name email role');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      res.json({
        message: 'HIRA assessment assigned successfully',
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// PATCH: Update worksheet
router.patch('/:companyId/:id/worksheet',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      let { worksheetRows } = req.body;

      // Ensure worksheetRows is always an array
      if (!Array.isArray(worksheetRows)) {
        worksheetRows = [worksheetRows];
      }

      // Clean up empty actionOwner values (avoid ObjectId casting error)
      worksheetRows = worksheetRows.map(row => ({
        ...row,
        actionOwner: row.actionOwner || null
      }));

      const company = await Company.findById(companyId);
      const hiraConfig = company.config?.hira || { statusMap: { inProgress: 'in_progress' } };

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        { 
          worksheetRows,
          status: hiraConfig.statusMap.inProgress || 'in_progress',
          riskSummary: {
            totalTasks: worksheetRows.length,
            highRiskCount: worksheetRows.filter(row => row.riskCategory.toLowerCase() === 'high').length,
            moderateRiskCount: worksheetRows.filter(row => row.riskCategory.toLowerCase() === 'moderate').length,
            lowRiskCount: worksheetRows.filter(row => row.riskCategory.toLowerCase() === 'low').length,
            significantRisks: worksheetRows.filter(row => row.significantNotSignificant.toLowerCase() === 'significant').length,
            totalRecommendations: worksheetRows.filter(row => row.recommendation && row.recommendation.trim() !== '').length
          },
          startedAt: new Date()
        },
        { new: true }
      );

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }
      
      res.json({
        message: 'Worksheet updated successfully',
        assessment
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);


// POST: Complete worksheet
router.post('/:companyId/:id/complete',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      let { worksheetRows } = req.body;
      // Ensure worksheetRows is always an array
      if (!Array.isArray(worksheetRows)) {
        worksheetRows = [worksheetRows];
      }

      // Clean up empty actionOwner values (avoid ObjectId casting error)
      worksheetRows = worksheetRows.map(row => ({
        ...row,
        actionOwner: row.actionOwner || null
      }));
      const company = await Company.findById(companyId);
      const hiraConfig = company.config?.hira || { statusMap: { completed: 'completed' } };

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        { 
          worksheetRows,
          status: hiraConfig.statusMap.completed || 'completed',
          completedAt: new Date(),
          riskSummary: {
            totalTasks: worksheetRows.length,
            highRiskCount: worksheetRows.filter(row => row.riskCategory.toLowerCase() === 'high').length,
            moderateRiskCount: worksheetRows.filter(row => row.riskCategory.toLowerCase() === 'moderate').length,
            lowRiskCount: worksheetRows.filter(row => row.riskCategory.toLowerCase() === 'low').length,
            significantRisks: worksheetRows.filter(row => row.significantNotSignificant.toLowerCase() === 'significant').length,
            totalRecommendations: worksheetRows.filter(row => row.recommendation && row.recommendation.trim() !== '').length
          },
        },
        { new: true }
      );

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      res.json({
        message: 'HIRA assessment completed successfully',
        assessment
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: Approve/Reject HIRA
router.post('/:companyId/:id/approve',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { action, comments } = req.body; // action: 'approve' or 'reject'

      const company = await Company.findById(companyId);
      const hiraConfig = company.config?.hira || { 
        statusMap: { approved: 'approved', rejected: 'rejected' } 
      };

      const updateData = {
        approvalComments: comments,
        approvedBy: req.user._id
      };

      if (action === 'approve') {
        updateData.status = hiraConfig.statusMap.approved || 'approved';
        updateData.approvedAt = new Date();
      } else {
        updateData.status = hiraConfig.statusMap.rejected || 'rejected';
        updateData.rejectionReason = comments;
      }

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        updateData,
        { new: true }
      )
      .populate('assessor', 'name email')
      .populate('approvedBy', 'name email')
      .populate('team', 'name role email');

      if (!assessment) {
        return res.status(404).json({ message: 'HIRA assessment not found' });
      }

      res.json({
        message: `HIRA assessment ${action}d successfully`,
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: Close HIRA
router.post('/:companyId/:id/close',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const assessment = await HIRA.findOneAndUpdate(
        { _id: id, companyId },
        { 
          status: 'closed',
          closedAt: new Date()
        },
        { new: true }
      );

      res.json({
        message: 'HIRA assessment closed successfully',
        assessment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// POST: AI Suggestions
router.post('/:companyId/:id/ai-suggestions',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { taskName, activityService, existingHazards = [] } = req.body;

      const prompt = `
        As a safety expert, provide suggestions for the following industrial task:

        Task: ${taskName}
        Activity/Service: ${activityService}
        Existing identified hazards: ${existingHazards.join(', ') || 'None identified yet'}

        Please provide:
        1. Additional potential hazards that might be missed
        2. Risk control measures
        3. Safety recommendations

        Format the response as JSON with the following structure:
        {
          "hazards": ["hazard1", "hazard2"],
          "controls": ["control1", "control2"], 
          "recommendations": ["recommendation1", "recommendation2"],
          "confidence": 0.95
        }
      `;

      // Call Gemini API
      const apiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await apiResponse.json();

      let suggestions;
      try {
        // Extract text response from Gemini
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        suggestions = JSON.parse(rawText);
      } catch (parseError) {
        // Fallback if AI doesn't return valid JSON
        suggestions = {
          hazards: ['Manual handling injuries', 'Slip, trip, fall hazards'],
          controls: ['Proper PPE usage', 'Safety training'],
          recommendations: ['Conduct regular safety audits', 'Implement safety procedures'],
          confidence: 0.8
        };
      }

      // Save AI suggestions to HIRA
      await HIRA.findByIdAndUpdate(id, {
        aiSuggestions: {
          ...suggestions,
          generatedAt: new Date()
        }
      });

      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET: Download assessment
router.get('/:companyId/:id/download/:format',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id, format } = req.params;
      
      const assessment = await HIRA.findOne({ _id: id, companyId })
        .populate('assessor', 'name email')
        .populate('plantId', 'name code')
        .populate('team', 'name role')
        .populate('worksheetRows.actionOwner', 'name');

      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('HIRA Assessment');

        // Add headers
        worksheet.addRow([
          'Task Name', 'Activity/Service', 'R/NR', 'Hazard/Concern',
          'Hazard Description', 'Likelihood', 'Consequence', 'Risk Score',
          'Existing Risk Control', 'S/NS', 'Risk Category', 'Recommendation'
        ]);

        // Add data rows
        assessment.worksheetRows.forEach(row => {
          worksheet.addRow([
            row.taskName,
            row.activityService,
            row.routineNonRoutine,
            row.hazardConcern,
            row.hazardDescription,
            row.likelihood,
            row.consequence,
            row.riskScore,
            row.existingRiskControl,
            row.significantNotSignificant,
            row.riskCategory,
            row.recommendation
          ]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=HIRA-${assessment.assessmentNumber}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
      } else if (format === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=HIRA-${assessment.assessmentNumber}.pdf`);
        
        doc.pipe(res);
        doc.fontSize(16).text(`HIRA Assessment: ${assessment.title}`, 50, 50);
        doc.fontSize(12).text(`Assessment Number: ${assessment.assessmentNumber}`, 50, 80);
        doc.text(`Plant: ${assessment.plantId.name}`, 50, 100);
        doc.text(`Process: ${assessment.process}`, 50, 120);
        
        // Add worksheet data
        let yPosition = 160;
        assessment.worksheetRows.forEach((row, index) => {
          doc.text(`${index + 1}. ${row.taskName}`, 50, yPosition);
          doc.text(`   Hazard: ${row.hazardConcern}`, 70, yPosition + 15);
          doc.text(`   Risk Score: ${row.riskScore} (${row.riskCategory})`, 70, yPosition + 30);
          yPosition += 60;
          
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
        });
        
        doc.end();
      } else if (format === 'word') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: `HIRA Assessment: ${assessment.title}`,
                heading: 'Title'
              }),
              new Paragraph({
                text: `Assessment Number: ${assessment.assessmentNumber}`
              }),
              new Paragraph({
                text: `Plant: ${assessment.plantId.name}`
              }),
              new Table({
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph('Task Name')] }),
                      new TableCell({ children: [new Paragraph('Hazard')] }),
                      new TableCell({ children: [new Paragraph('Risk Score')] }),
                      new TableCell({ children: [new Paragraph('Category')] })
                    ]
                  }),
                  ...assessment.worksheetRows.map(row => new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(row.taskName)] }),
                      new TableCell({ children: [new Paragraph(row.hazardConcern)] }),
                      new TableCell({ children: [new Paragraph(String(row.riskScore))] }),
                      new TableCell({ children: [new Paragraph(row.riskCategory)] })
                    ]
                  }))
                ]
              })
            ]
          }]
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=HIRA-${assessment.assessmentNumber}.docx`);
        
        const buffer = await Packer.toBuffer(doc);
        res.send(buffer);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;