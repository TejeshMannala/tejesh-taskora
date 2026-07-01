import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  signupUser,
  loginUser,
  getUserProfile,
  checkEmail,
  acceptAgreement,
  googleLogin,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rate limiting for auth routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});

router.get('/check-email', checkEmail);
router.post('/signup', authLimiter, signupUser);
router.post('/login', authLimiter, loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/accept-agreement', protect, acceptAgreement);
router.post('/google-login', authLimiter, googleLogin);

export default router;
