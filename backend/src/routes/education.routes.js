import express from 'express';
import { getEducationTypes, getGroups, getSubjects } from '../controllers/education.controller.js';

const router = express.Router();

router.get('/types', getEducationTypes);
router.get('/groups', getGroups);
router.get('/subjects', getSubjects);

export default router;
