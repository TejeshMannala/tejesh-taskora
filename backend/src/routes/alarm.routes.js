import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getActiveAlarms, acknowledgeAlarm, completeTaskAndStopAlarm, getAlarmHistory, getAlarmState,
} from '../controllers/alarm.controller.js';

const router = express.Router();

router.use(protect);

router.get('/active', getActiveAlarms);
router.get('/state', getAlarmState);
router.get('/history', getAlarmHistory);
router.post('/:taskId/acknowledge', acknowledgeAlarm);
router.post('/:taskId/complete', completeTaskAndStopAlarm);

export default router;
