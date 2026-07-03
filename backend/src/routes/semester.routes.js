import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getUserSemesters,
  initializeUserSemesters,
  activateNextSemester,
  completeSemester,
  getSemesterSubjects,
  getAcademicProgress,
} from '../controllers/semester.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserSemesters);
router.post('/init', initializeUserSemesters);
router.post('/activate', activateNextSemester);
router.post('/complete', completeSemester);
router.get('/:semesterId/subjects', getSemesterSubjects);
router.get('/progress', getAcademicProgress);

export default router;
