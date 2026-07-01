import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getAchievements, checkAchievements, seedAchievements } from '../controllers/achievement.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getAchievements);
router.post('/check', checkAchievements);
router.post('/seed', seedAchievements);

export default router;
