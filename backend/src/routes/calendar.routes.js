import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getEvents, createEvent, updateEvent, deleteEvent, getConsolidatedCalendar } from '../controllers/calendar.controller.js';

const router = express.Router();

router.use(protect);

router.get('/consolidated', getConsolidatedCalendar);
router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
