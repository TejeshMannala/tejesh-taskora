import express from 'express';
import { adminLogin, getAdminProfile, seedAdmin } from '../controllers/adminAuth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/admin.middleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/seed', seedAdmin);
router.get('/profile', protect, adminOnly, getAdminProfile);

export default router;
