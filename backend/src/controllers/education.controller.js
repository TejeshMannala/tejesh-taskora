import mongoose from 'mongoose';
import Education from '../models/education.model.js';
import Group from '../models/group.model.js';
import SharedSubject from '../models/sharedSubject.model.js';

export const getEducationTypes = async (req, res) => {
  try {
    const types = await Education.find({ isActive: { $ne: false } }).sort({ name: 1 });
    res.json({ success: true, educationTypes: types.map(t => t.name) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGroups = async (req, res) => {
  try {
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
    if (!req.query.group) {
      return res.json({ success: true, subjects: [] });
    }
    let groupId = req.query.group;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      const name = groupId.includes(':') ? groupId.split(':').pop() : groupId;
      const group = await Group.findOne({ name }).collation({ locale: 'en', strength: 2 });
      if (!group) return res.json({ success: true, subjects: [] });
      groupId = group._id;
    }
    const subjects = await SharedSubject.find({ group: groupId, isActive: { $ne: false } })
      .populate('group', 'name')
      .sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
