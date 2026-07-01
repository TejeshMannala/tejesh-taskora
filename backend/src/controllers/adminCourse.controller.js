import Group from '../models/group.model.js';
import Subject from '../models/sharedSubject.model.js';
import Roadmap from '../models/roadmap.model.js';
import { getIO } from '../sockets/index.js';
import { ensureAcademicDefaults } from './seed.controller.js';

// ---- Groups ----

export const getGroups = async (req, res) => {
  try {
    const filter = {};
    if (req.query.educationType) filter.educationType = req.query.educationType;
    const groups = await Group.find(filter).sort({ name: 1 });
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const group = await Group.create(req.body);
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'group', action: 'create' });
    res.status(201).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'group', action: 'update' });
    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    await Subject.deleteMany({ group: req.params.id });
    await Roadmap.deleteMany({ subject: { $in: (await Subject.find({ group: req.params.id }).select('_id')).map(s => s._id) } });
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'group', action: 'delete' });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Subjects ----

export const getSubjects = async (req, res) => {
  try {
    const filter = {};
    if (req.query.group) filter.group = req.query.group;
    const subjects = await Subject.find(filter).populate('group', 'name').sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    const populated = await subject.populate('group', 'name');
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'subject', action: 'create' });
    res.status(201).json({ success: true, subject: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true }).populate('group', 'name');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'subject', action: 'update' });
    res.json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    await Roadmap.deleteMany({ subject: req.params.id });
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'subject', action: 'delete' });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Roadmaps ----

export const getRoadmaps = async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    const roadmaps = await Roadmap.find(filter).populate('subject', 'name');
    res.json({ success: true, roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.create(req.body);
    const populated = await roadmap.populate('subject', 'name');
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'roadmap', action: 'create' });
    res.status(201).json({ success: true, roadmap: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true }).populate('subject', 'name');
    if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'roadmap', action: 'update' });
    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndDelete(req.params.id);
    if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });
    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'roadmap', action: 'delete' });
    res.json({ success: true, message: 'Roadmap deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
