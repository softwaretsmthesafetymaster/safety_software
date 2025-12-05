import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';
import cookieParser from 'cookie-parser';

// Route imports
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import permitRoutes from './routes/permits.js';
import incidentRoutes from './routes/incidents.js';
import hazopRoutes from './routes/hazop.js';
import hiraRoutes from './routes/hira.js';
import bbsRoutes from './routes/bbs.js';
import auditRoutes from './routes/audits.js';
import plantRoutes from './routes/plants.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import paymentRoutes from './routes/payment.js';
import aiRoutes from './routes/ai.js';
import uploadRoutes from './routes/upload.js';
import emailService from './services/emailService.js';
import notificationService from './services/notificationService.js';
import reminderService from './services/reminderService.js';
import workflowService from './services/workflowService.js';
import templateRoutes from './routes/templates.js';
import observationRoutes from './routes/observations.js';
import checklistRoutes from './routes/checklist.js';
import platformRoutes from './routes/platform.js'
import dashboardRoutes from './routes/dashboard.js'
import permitChecklist from './routes/permitChecklist.js'

import { requestLogger, errorLogger } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/hazop', hazopRoutes);
app.use('/api/hira', hiraRoutes);
app.use('/api/bbs', bbsRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/platform',platformRoutes)
app.use('/api/dashboard',dashboardRoutes)
app.use('/api/permit/checklist',permitChecklist)
// Workflow routes
app.use('/api/workflow', (req, res, next) => {
  // Generic workflow handler
  const { module, action } = req.body;
  const { companyId, itemId } = req.params;
  
  // Route to appropriate workflow service
  workflowService.processWorkflow(module, action, req.user, req.body.data)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ message: error.message }));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Initialize services
    console.log('Initializing services...');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Email service initialized');
      console.log('Notification service initialized');
      console.log('Reminder service initialized');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();