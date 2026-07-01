import mongoose from 'mongoose';
import Group from '../models/group.model.js';
import Subject from '../models/sharedSubject.model.js';
import Roadmap from '../models/roadmap.model.js';
import { ensureAcademicDefaults } from './seed.controller.js';

export const getGroups = async (req, res) => {
  try {
    console.log('[Academic] getGroups called with educationType:', req.query.educationType);
    console.log('[Academic] req.params:', req.params);
    await ensureAcademicDefaults();
    const filter = { isActive: { $ne: false } };
    if (req.query.educationType) filter.educationType = req.query.educationType;
    console.log('[Academic] Query filter:', JSON.stringify(filter));
    const groups = await Group.find(filter).sort({ name: 1 });
    console.log('[Academic] Groups found:', groups.length);
    console.log('[Academic] Groups:', JSON.stringify(groups.map(g => ({ _id: g._id, name: g.name, educationType: g.educationType }))));
    res.json({ success: true, groups });
  } catch (error) {
    console.error('[Academic] getGroups failed:', error.stack || error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    console.log('[Academic] getSubjects called with query:', req.query);
    console.log('[Academic] req.params:', req.params);
    await ensureAcademicDefaults();
    const filter = { isActive: { $ne: false } };
    if (req.query.group) {
      if (mongoose.Types.ObjectId.isValid(req.query.group)) {
        filter.group = req.query.group;
      } else {
        console.log('[Academic] Invalid group ID:', req.query.group);
        return res.json({ success: true, subjects: [] });
      }
    }
    const subjects = await Subject.find(filter).populate('group', 'name').sort({ name: 1 });
    console.log('[Academic] Subjects found:', subjects.length);
    console.log('[Academic] Subjects:', JSON.stringify(subjects.map(s => ({ _id: s._id, name: s.name, group: s.group?.name }))));
    res.json({ success: true, subjects });
  } catch (error) {
    console.error('getSubjects failed:', error.stack || error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoadmap = async (req, res) => {
  try {
    if (!req.query.subject) {
      return res.status(400).json({ success: false, message: 'subject query parameter is required' });
    }
    const roadmap = await Roadmap.findOne({ subject: req.query.subject }).populate('subject', 'name');
    res.json({ success: true, roadmap: roadmap || { weeks: [] } });
  } catch (error) {
    console.error('getRoadmap failed:', error.stack || error);
    res.status(500).json({ success: false, message: error.message });
  }
};
