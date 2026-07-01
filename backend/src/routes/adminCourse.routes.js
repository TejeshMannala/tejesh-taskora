import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/admin.middleware.js';
import {
  getGroups, createGroup, updateGroup, deleteGroup,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap,
} from '../controllers/adminCourse.controller.js';
import { seedAcademicData } from '../controllers/seed.controller.js';

const router = express.Router();

router.use(protect, adminOnly);

router.post('/academic/seed', seedAcademicData);

router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.put('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);

router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

router.get('/roadmaps', getRoadmaps);
router.post('/roadmaps', createRoadmap);
router.put('/roadmaps/:id', updateRoadmap);
router.delete('/roadmaps/:id', deleteRoadmap);

export default router;
