import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getTasks, getTask, createTask, updateTask, deleteTask, toggleTask, getTaskStats } from '../controllers/task.controller.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getTaskStats);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/toggle', toggleTask);
router.delete('/:id', deleteTask);

export default router;
