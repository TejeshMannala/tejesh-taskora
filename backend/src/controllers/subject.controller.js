import Subject from '../models/subject.model.js';
import Task from '../models/task.model.js';
import StudySession from '../models/studySession.model.js';
import User from '../models/user.model.js';
import { generateSubjectsForUser } from './user.controller.js';

export const getSubjects = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('group');
    if (user?.group) {
      await generateSubjectsForUser(req.user._id, user.group);
    }
    const subjects = await Subject.find({ user: req.user._id }).sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, color, icon, targetHours } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Subject name is required' });
    const subject = await Subject.create({ user: req.user._id, name, color, icon, targetHours });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Subject already exists' });
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    let subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    res.json({ success: true, subject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjectProgress = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const sessions = await StudySession.aggregate([
      { $match: { user: req.user._id, subject: subject._id } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' }, sessionsCount: { $sum: 1 } } },
    ]);

    const tasks = await Task.countDocuments({ user: req.user._id, subject: subject.name });
    const completedTasks = await Task.countDocuments({ user: req.user._id, subject: subject.name, status: 'Completed' });

    res.json({
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
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
