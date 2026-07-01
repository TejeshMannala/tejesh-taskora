import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/admin.middleware.js';
import { getAllTasks, deleteTask } from '../controllers/adminTask.controller.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/tasks', getAllTasks);
router.delete('/tasks/:id', deleteTask);

export default router;
