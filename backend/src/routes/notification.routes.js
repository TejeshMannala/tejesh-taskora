import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } from '../controllers/notification.controller.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getUnreadCount);
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
