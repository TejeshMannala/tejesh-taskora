import express from 'express';
import rateLimit from 'express-rate-limit';
import { sendOTP, verifyOTP, resetPassword } from '../controllers/otp.controller.js';

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again after 15 minutes.' },
});

router.post('/send-otp', otpLimiter, sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/verify', verifyOTP);
router.post('/reset-password', resetPassword);

export default router;
