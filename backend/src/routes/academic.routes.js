import express from 'express';
import {
  getGroups,
  getSubjects,
  getRoadmap,
  getSyllabus,
} from '../controllers/academic.controller.js';
import { seedAcademicData } from '../controllers/seed.controller.js';
import { adminOnly } from '../middlewares/admin.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/groups', getGroups);
router.get('/subjects', getSubjects);
router.get('/roadmap', getRoadmap);
router.get('/syllabus', getSyllabus);
router.post('/seed', protect, adminOnly, seedAcademicData);

export default router;
