import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getDashboardStats, getWeeklyActivity, getMonthlyAnalytics, getSubjectPerformance } from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/weekly', getWeeklyActivity);
router.get('/monthly', getMonthlyAnalytics);
router.get('/subjects', getSubjectPerformance);

export default router;
