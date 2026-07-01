import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/admin.middleware.js';
import {
  getUsers, getUserById, updateUser, deleteUser, getDashboardStats,
} from '../controllers/adminUser.controller.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
