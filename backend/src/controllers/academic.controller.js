import mongoose from 'mongoose';
import Group from '../models/group.model.js';
import Subject from '../models/sharedSubject.model.js';
import Roadmap from '../models/roadmap.model.js';

export const getGroups = async (req, res) => {
  try {
    const filter = { isActive: { $ne: false } };
    if (req.query.educationType) filter.educationType = req.query.educationType;
    const groups = await Group.find(filter).sort({ name: 1 });
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveGroupId = async (raw) => {
  if (!raw) return null;
  if (mongoose.Types.ObjectId.isValid(raw)) return raw;
  // Fallback ID pattern: "fb:EducationType:GroupName"
  const name = raw.includes(':') ? raw.split(':').pop() : raw;
  const group = await Group.findOne({ name }).collation({ locale: 'en', strength: 2 });
  return group?._id || null;
};

export const getSubjects = async (req, res) => {
  try {
    const filter = { isActive: { $ne: false } };
    if (req.query.group) {
      const resolved = await resolveGroupId(req.query.group);
      if (!resolved) return res.json({ success: true, subjects: [] });
      filter.group = resolved;
    }
    const subjects = await Subject.find(filter).populate('group', 'name').sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSyllabus = async (req, res) => {
  try {
    if (!req.query.group) {
      return res.json({ success: true, syllabus: [] });
    }
    const resolved = await resolveGroupId(req.query.group);
    if (!resolved) return res.json({ success: true, syllabus: [] });
    const subjects = await Subject.find({ group: resolved, isActive: { $ne: false } })
      .populate('group', 'name')
      .sort({ name: 1 });

    const syllabus = await Promise.all(
      subjects.map(async (subject) => {
        const roadmap = await Roadmap.findOne({ subject: subject._id });
        return {
          _id: subject._id,
          name: subject.name,
          description: subject.description,
          color: subject.color,
          icon: subject.icon,
          group: subject.group,
          roadmap: roadmap || { weeks: [] },
        };
      })
    );

    res.json({ success: true, syllabus });
  } catch (error) {
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
    res.status(500).json({ success: false, message: error.message });
  }
};
