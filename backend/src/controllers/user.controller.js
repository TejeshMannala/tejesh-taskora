import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Group from '../models/group.model.js';
import Subject from '../models/subject.model.js';
import SharedSubject from '../models/sharedSubject.model.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { generateUserSemesters } from './semester.controller.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateSubjectsForUser = async (userId, groupId) => {
  if (!groupId) return [];

  const sharedSubjects = await SharedSubject.find({ group: groupId, isActive: { $ne: false } });
  const created = [];

  for (const shared of sharedSubjects) {
    const existing = await Subject.findOne({ user: userId, name: shared.name });
    if (!existing) {
      const subject = await Subject.create({
        user: userId,
        name: shared.name,
        color: shared.color,
        icon: shared.icon,
        targetHours: 40,
      });
      created.push(subject);
    }
  }

  return created;
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('achievements').populate('group', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        profilePicture: user.profilePicture,
        college: user.college,
        university: user.university,
        educationType: user.educationType,
        group: user.group,
        profileLocked: user.profileLocked,
        studyStreak: user.studyStreak,
        longestStreak: user.longestStreak,
        totalStudyHours: user.totalStudyHours,
        productivityScore: user.productivityScore,
        studyGoals: user.studyGoals,
        achievements: user.achievements,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveGroup = async (groupId, educationType) => {
  if (!groupId || groupId === '') return undefined;
  if (mongoose.Types.ObjectId.isValid(groupId)) return groupId;
  const group = await Group.findOne({ name: groupId, educationType });
  if (group) return group._id;
  const fallbackMatch = typeof groupId === 'string' && groupId.startsWith('fb:')
    ? groupId.split(':').pop()
    : null;
  if (fallbackMatch) {
    const found = await Group.findOne({ name: fallbackMatch, educationType });
    if (found) return found._id;
  }
  return undefined;
};

export const updateProfile = async (req, res) => {
  try {
    let { name, avatar, profilePicture, college, university, educationType, studyGoals, group } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    group = await resolveGroup(group, educationType);

    // If profile is locked, prevent editing academic fields
    if (user.profileLocked) {
      if (college || university || educationType || group) {
        return res.status(403).json({ success: false, message: 'Academic profile is locked. These fields can only be changed once.' });
      }
      if (name?.trim()) user.name = name.trim();
      if (avatar !== undefined) user.avatar = avatar;
      if (profilePicture !== undefined) {
        user.profilePicture = profilePicture;
        user.avatar = profilePicture || user.avatar;
      }
      await user.save();
      const populatedUser = await User.findById(user._id).populate('group', 'name');
      return res.json({
        success: true,
        message: 'Profile updated',
        user: {
          _id: populatedUser._id,
          name: populatedUser.name,
          email: populatedUser.email,
          avatar: populatedUser.avatar,
          profilePicture: populatedUser.profilePicture,
          profileLocked: populatedUser.profileLocked,
        },
      });
    }

    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Full name is required' });
    if (!college?.trim()) return res.status(400).json({ success: false, message: 'College name is required' });
    if (!educationType) return res.status(400).json({ success: false, message: 'Education type is required' });
    if (!group) return res.status(400).json({ success: false, message: 'Group or branch is required' });

    // Lock profile after first save
    user.profileLocked = true;

    user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
      user.avatar = profilePicture || user.avatar;
    }
    user.college = college.trim();
    if (university?.trim()) user.university = university.trim();
    user.educationType = educationType;
    if (studyGoals) user.studyGoals = studyGoals;
    user.group = group;

    await user.save();

    let subjects = [];
    if (user.group) {
      subjects = await generateSubjectsForUser(user._id, user.group);
    }

    try {
      await generateUserSemesters(user._id);
    } catch (semError) {
      console.warn('Semester initialization:', semError.message);
    }

    const populatedUser = await User.findById(user._id).populate('group', 'name');

    res.json({
      success: true,
      message: subjects.length ? 'Profile updated and subjects generated' : 'Profile updated',
      user: {
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        avatar: populatedUser.avatar,
        profilePicture: populatedUser.profilePicture,
        college: populatedUser.college,
        university: populatedUser.university,
        educationType: populatedUser.educationType,
        group: populatedUser.group,
        profileLocked: populatedUser.profileLocked,
      },
      subjects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const oldUser = await User.findById(req.user._id);
    if (!oldUser) return res.status(404).json({ success: false, message: 'User not found' });

    const oldProfilePicture = oldUser.profilePicture;

    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePicture: imageUrl,
        avatar: imageUrl,
      },
      { new: true }
    );

    if (oldProfilePicture) {
      const oldFilename = oldProfilePicture.replace('/uploads/', '');
      const oldPath = path.join(__dirname, '..', '..', 'uploads', oldFilename);
      try {
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {}
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      profilePicture: imageUrl,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully', token: generateToken(user._id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const lastActive = user.lastActive || new Date(0);
    const daysSinceLastActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));

    if (daysSinceLastActive === 0) {
    } else if (daysSinceLastActive === 1) {
      user.studyStreak += 1;
    } else {
      user.studyStreak = 1;
    }

    if (user.studyStreak > user.longestStreak) {
      user.longestStreak = user.studyStreak;
    }

    user.lastActive = now;
    await user.save();

    res.json({ success: true, studyStreak: user.studyStreak, longestStreak: user.longestStreak });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { returnDocument: 'after' });
    res.json({ success: true, avatar: user.avatar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
