import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { authenticate } from "../middleware/auth.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* -----------------------------
   CREATE PAYMENT ORDER
--------------------------------*/
router.post("/create-order", authenticate, async (req, res) => {
  try {
    const { amount, currency = "INR", modules = [], plan = "professional" } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const options = {
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        companyId: req.user.companyId,
        userId: req.user._id,
        modules: modules.length ? modules.join(",") : "none",
        plan,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error("⚠️ Payment Order Error:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
});


/* -----------------------------
   VERIFY PAYMENT SIGNATURE
--------------------------------*/
router.post("/verify", authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      modules = [],
      plan = "professional",
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Invalid request payload" });
    }

    // Validate signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    // ----- Subscription Logic -----
    const now = new Date();
    const subscriptionMonths = plan === "enterprise" ? 12 : 1;

    let newExpiryDate;

    // Extend subscription if active
    if (company.subscription?.expiryDate && new Date(company.subscription.expiryDate) > now) {
      newExpiryDate = new Date(company.subscription.expiryDate);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + subscriptionMonths);
    } else {
      newExpiryDate = new Date();
      newExpiryDate.setMonth(newExpiryDate.getMonth() + subscriptionMonths);
    }

    // ----- Enable purchased modules -----
    modules.forEach((m) => {
    if (!company.config?.modules) company.config.modules = {};

    company.config.modules[m] = {
         ...company.config.modules[m], 
      enabled: true
     };
    });


    // Save subscription changes
    company.subscription = {
      plan,
      status: "active",
      expiryDate: newExpiryDate,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    };

    // Store payment history entry
    if (!company.paymentHistory) company.paymentHistory = [];
    company.paymentHistory.push({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      modules,
      plan,
      paidAt: new Date(),
      amount: req.body.amount,
    });

    company.markModified("config");
    await company.save();

    // Update user paid status
    const user = await User.findById(req.user._id);
    if (user) {
      user.isPaid = true;
      await user.save();
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
      subscription: company.subscription,
      enabledModules: modules,
    });
  } catch (error) {
    console.error("❌ Payment Verification Error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
});


/* -----------------------------
   GET PAYMENT HISTORY
--------------------------------*/
router.get("/history", authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    res.json({
      success: true,
      subscription: company.subscription,
      paymentHistory: company.paymentHistory || [],
    });
  } catch (error) {
    console.error("⚠️ Payment History Error:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

export default router;
