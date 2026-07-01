import Group from '../models/group.model.js';
import SharedSubject from '../models/sharedSubject.model.js';
import { ensureAcademicDefaults } from './seed.controller.js';

const EDUCATION_TYPES = ['Intermediate', 'Degree', 'B.Tech'];

export const getEducationTypes = async (req, res) => {
  try {
    res.json({ success: true, educationTypes: EDUCATION_TYPES });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGroups = async (req, res) => {
  try {
    await ensureAcademicDefaults();
    const filter = { isActive: { $ne: false } };
    if (req.query.educationType) {
      filter.educationType = req.query.educationType;
    }
    const groups = await Group.find(filter).sort({ name: 1 });
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    await ensureAcademicDefaults();
    if (!req.query.group) {
      return res.json({ success: true, subjects: [] });
    }
    const subjects = await SharedSubject.find({ group: req.query.group, isActive: { $ne: false } })
      .populate('group', 'name')
      .sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
