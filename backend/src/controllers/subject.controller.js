import mongoose from 'mongoose';
import Subject from '../models/subject.model.js';
import Task from '../models/task.model.js';
import StudySession from '../models/studySession.model.js';
import User from '../models/user.model.js';
import { generateSubjectsForUser } from './user.controller.js';

const log = (msg, data = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SubjectController] ${msg}`, Object.keys(data).length ? data : '');
};

export const getSubjects = async (req, res) => {
  const userId = req.user?._id;
  log('getSubjects called', { userId: userId?.toString() });

  try {
    const user = await User.findById(userId).select('group');
    if (!user) {
      log('User not found', { userId: userId?.toString() });
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user?.group) {
      const groupId = user.group._id || user.group;
      log('Generating subjects for user', { userId: userId?.toString(), groupId: groupId?.toString() });
      await generateSubjectsForUser(userId, groupId);
    } else {
      log('No group assigned to user', { userId: userId?.toString() });
    }

    const subjects = await Subject.find({ user: userId }).sort({ name: 1 });
    log('Subjects fetched', { userId: userId?.toString(), count: subjects.length });
    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    console.error('[getSubjects] ERROR:', error.message);
    console.error('[getSubjects] Stack:', error.stack);
    return res.status(500).json({ success: false, message: 'Server error while fetching subjects' });
  }
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createSubject = async (req, res) => {
  const userId = req.user?._id;
  log('createSubject called', { userId: userId?.toString(), body: req.body });

  try {
    const { name, color, icon, targetHours } = req.body;
    if (!name?.trim()) {
      log('createSubject validation failed: name required');
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    const subject = await Subject.create({
      user: userId,
      name: name.trim(),
      color: color || '#7c3aed',
      icon: icon || 'book',
      targetHours: targetHours || 40,
    });

    log('createSubject success', { subjectId: subject._id.toString(), name: subject.name });
    return res.status(201).json({ success: true, subject });
  } catch (error) {
    if (error.code === 11000) {
      log('createSubject duplicate');
      return res.status(400).json({ success: false, message: 'Subject already exists' });
    }
    console.error('[createSubject] ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  const userId = req.user?._id;
  log('updateSubject called', { userId: userId?.toString(), subjectId: req.params.id });

  try {
    if (!isValidObjectId(req.params.id)) {
      log('updateSubject invalid ID');
      return res.status(400).json({ success: false, message: 'Invalid subject ID' });
    }

    const existing = await Subject.findOne({ _id: req.params.id, user: userId });
    if (!existing) {
      log('updateSubject not found');
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { ...req.body, user: userId },
      { returnDocument: 'after', runValidators: true }
    );

    log('updateSubject success', { subjectId: subject._id.toString() });
    return res.status(200).json({ success: true, subject });
  } catch (error) {
    console.error('[updateSubject] ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  const userId = req.user?._id;
  log('deleteSubject called', { userId: userId?.toString(), subjectId: req.params.id });

  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject ID' });
    }

    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!subject) {
      log('deleteSubject not found');
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    log('deleteSubject success', { subjectId: req.params.id, name: subject.name });
    return res.status(200).json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    console.error('[deleteSubject] ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjectProgress = async (req, res) => {
  const userId = req.user?._id;
  log('getSubjectProgress called', { userId: userId?.toString(), subjectId: req.params.id });

  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject ID' });
    }

    const subject = await Subject.findOne({ _id: req.params.id, user: userId });
    if (!subject) {
      log('getSubjectProgress not found');
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const sessions = await StudySession.aggregate([
      { $match: { user: userId, subject: subject._id } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' }, sessionsCount: { $sum: 1 } } },
    ]);

    const tasks = await Task.countDocuments({ user: userId, subject: subject.name });
    const completedTasks = await Task.countDocuments({ user: userId, subject: subject.name, status: 'Completed' });

    log('getSubjectProgress success', { subjectId: req.params.id, tasks, completedTasks });

    return res.status(200).json({
      success: true,
      progress: {
        totalHours: sessions.length > 0 ? (sessions[0].totalMinutes / 60).toFixed(1) : 0,
        sessionsCount: sessions.length > 0 ? sessions[0].sessionsCount : 0,
        totalTasks: tasks,
        completedTasks,
        taskCompletionRate: tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('[getSubjectProgress] ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
