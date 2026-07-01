import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getTodaySchedule, getWeeklySchedule } from '../controllers/schedule.controller.js';

const router = express.Router();

router.use(protect);

router.get('/today', getTodaySchedule);
router.get('/weekly', getWeeklySchedule);
router.get('/', getSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
