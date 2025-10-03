import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import Company from '../models/Company.js';
import User from '../models/User.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount, currency = 'INR', modules } = req.body;

    const options = {
      amount: amount, // amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id,
        modules: modules.join(',')
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      modules
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update company subscription
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Enable selected modules
    const moduleConfig = {};
    modules.forEach(moduleId => {
      moduleConfig[moduleId] = { enabled: true };
    });

    // Initialize config if it doesn't exist
    if (!company.config) {
      company.config = { modules: {} };
    }
    if (!company.config.modules) {
      company.config.modules = {};
    }

    // Update modules
    Object.keys(moduleConfig).forEach(moduleKey => {
      company.config.modules[moduleKey] = { enabled: true };
    });
    company.subscription = {
      plan: 'professional',
      status: 'active',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    };

    company.markModified('config');
    await company.save();

    const user= await User.findById(req.user._id);
    if (user) {
      user.isPaid = true;
      await user.save();
    }
    res.json({ 
      message: 'Payment verified successfully',
      subscription: company.subscription 
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Get payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // In a real application, you would store payment history in a separate collection
    res.json({
      subscription: company.subscription,
      paymentHistory: [] // Implement payment history storage
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

export default router;