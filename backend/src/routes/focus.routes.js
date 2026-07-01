import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { saveSession, getSessions, getTodayStats } from '../controllers/focus.controller.js';

const router = express.Router();

router.use(protect);

router.get('/today', getTodayStats);
router.get('/sessions', getSessions);
router.post('/sessions', saveSession);

export default router;
