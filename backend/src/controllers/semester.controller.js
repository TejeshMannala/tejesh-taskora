import Semester from '../models/semester.model.js';
import UserSemester from '../models/userSemester.model.js';
import SharedSubject from '../models/sharedSubject.model.js';
import Subject from '../models/subject.model.js';
import User from '../models/user.model.js';
import { ensureAcademicDefaults } from './seed.controller.js';

export const getUserSemesters = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.educationType) {
      return res.json({ success: true, semesters: [], message: 'Complete your profile first' });
    }

    const semesters = await Semester.find({ educationType: user.educationType, isActive: true })
      .sort({ semesterNumber: 1 });

    const userSemesters = await UserSemester.find({ user: req.user._id })
      .populate('semester');

    const semesterMap = {};
    for (const us of userSemesters) {
      if (us.semester) {
        semesterMap[us.semester._id.toString()] = us;
      }
    }

    const result = semesters.map((sem) => {
      const us = semesterMap[sem._id.toString()];
      return {
        _id: sem._id,
        educationType: sem.educationType,
        yearNumber: sem.yearNumber,
        semesterNumber: sem.semesterNumber,
        label: sem.label,
        status: us ? us.status : 'locked',
        completionPercentage: us ? us.completionPercentage : 0,
        subjectCount: us ? us.subjectCount : 0,
        completedSubjectCount: us ? us.completedSubjectCount : 0,
        completedSyllabusCount: us ? us.completedSyllabusCount : 0,
        startedAt: us?.startedAt || null,
        completedAt: us?.completedAt || null,
      };
    });

    res.json({ success: true, semesters: result });
  } catch (error) {
    console.error('getUserSemesters failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const initializeUserSemesters = async (req, res) => {
  try {
    const result = await generateUserSemesters(req.user._id);
    res.json({ success: true, message: `${result.created} semesters initialized`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateUserSemesters = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.educationType) throw new Error('User profile incomplete');

  await ensureAcademicDefaults();

  const semesters = await Semester.find({ educationType: user.educationType, isActive: true })
    .sort({ semesterNumber: 1 });

  let created = 0;
  for (let i = 0; i < semesters.length; i++) {
    const sem = semesters[i];
    const existing = await UserSemester.findOne({ user: userId, semester: sem._id });
    if (!existing) {
      const status = i === 0 ? 'active' : 'locked';
      await UserSemester.create({
        user: userId,
        semester: sem._id,
        status,
      });
      created += 1;
    }
  }

  const firstUserSem = await UserSemester.findOne({ user: userId, status: 'active' })
    .populate('semester');
  if (firstUserSem) {
    await generateSubjectsForSemester(userId, firstUserSem.semester);
  }

  return { created };
};

export const generateSubjectsForSemester = async (userId, semesterDoc) => {
  const user = await User.findById(userId).populate('group');
  if (!user?.group) return [];

  const sharedSubjects = await SharedSubject.find({
    group: user.group._id,
    semester: semesterDoc._id,
    isActive: { $ne: false },
  });

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
        semester: semesterDoc._id,
      });
      created.push(subject);
    }
  }

  const userSem = await UserSemester.findOne({ user: userId, semester: semesterDoc._id });
  if (userSem) {
    userSem.subjectCount = created.length > 0
      ? await Subject.countDocuments({ user: userId, semester: semesterDoc._id })
      : await Subject.countDocuments({ user: userId, semester: semesterDoc._id });
    await userSem.save();
  }

  return created;
};

export const activateNextSemester = async (req, res) => {
  try {
    const { semesterId } = req.body;
    const userSem = await UserSemester.findOne({ user: req.user._id, semester: semesterId })
      .populate('semester');
    if (!userSem) return res.status(404).json({ success: false, message: 'Semester not found' });

    userSem.status = 'active';
    userSem.startedAt = new Date();
    await userSem.save();

    await generateSubjectsForSemester(req.user._id, userSem.semester);

    res.json({ success: true, message: 'Semester activated', userSemester: userSem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeSemester = async (req, res) => {
  try {
    const { semesterId } = req.body;
    const userSem = await UserSemester.findOne({ user: req.user._id, semester: semesterId })
      .populate('semester');
    if (!userSem) return res.status(404).json({ success: false, message: 'Semester not found' });

    userSem.status = 'completed';
    userSem.completionPercentage = 100;
    userSem.completedAt = new Date();
    await userSem.save();

    const nextSem = await UserSemester.findOne({ user: req.user._id })
      .where('status')
      .equals('locked')
      .populate('semester')
      .sort({ 'semester.semesterNumber': 1 });

    if (nextSem) {
      nextSem.status = 'active';
      nextSem.startedAt = new Date();
      await nextSem.save();
      await generateSubjectsForSemester(req.user._id, nextSem.semester);
    }

    res.json({ success: true, message: 'Semester completed', completed: userSem, next: nextSem || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSemesterSubjects = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const semester = await Semester.findById(semesterId);
    if (!semester) return res.status(404).json({ success: false, message: 'Semester not found' });

    const subjects = await Subject.find({ user: req.user._id, semester: semesterId })
      .sort({ name: 1 });

    res.json({ success: true, subjects, semester });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAcademicProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('group', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const userSems = await UserSemester.find({ user: req.user._id })
      .populate('semester')
      .sort({ 'semester.semesterNumber': 1 });
    const totalSems = userSems.length;
    const completedSems = userSems.filter((s) => s.status === 'completed').length;
    const activeSem = userSems.find((s) => s.status === 'active');
    const totalSubjects = await Subject.countDocuments({ user: req.user._id });

    const totalHours = user.totalStudyHours || 0;

    res.json({
      success: true,
      progress: {
        totalSemesters: totalSems,
        completedSemesters: completedSems,
        activeSemester: activeSem
          ? { id: activeSem.semester?._id, label: activeSem.semester?.label, completion: activeSem.completionPercentage }
          : null,
        semesterCompletionRate: totalSems > 0 ? Math.round((completedSems / totalSems) * 100) : 0,
        totalSubjects,
        totalStudyHours: totalHours,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
