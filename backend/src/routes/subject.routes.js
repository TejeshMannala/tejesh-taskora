import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getSubjects, createSubject, updateSubject, deleteSubject, getSubjectProgress } from '../controllers/subject.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getSubjects);
router.post('/', createSubject);
router.get('/:id/progress', getSubjectProgress);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
