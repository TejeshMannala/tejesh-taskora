import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import upload from '../config/multer.js';
import User from '../models/user.model.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  updateStreak,
  uploadAvatar,
  uploadProfileImage,
} from '../controllers/user.controller.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile-lock', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.profileLocked = true;
    await user.save();
    res.json({ success: true, message: 'Profile locked', profileLocked: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/password', changePassword);
router.patch('/streak', updateStreak);
router.post('/avatar', uploadAvatar);

const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Multer Error]', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size must be less than 5MB' });
      }
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    console.log('[Upload] File received:', req.file?.originalname, req.file?.size, 'bytes');
    next();
  });
};

router.post('/profile/image', uploadMiddleware, uploadProfileImage);
router.delete('/account', deleteAccount);

export default router;
