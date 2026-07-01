import Task from '../models/task.model.js';
import StudySession from '../models/studySession.model.js';
import Subject from '../models/subject.model.js';
import Event from '../models/event.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalTasks = await Task.countDocuments({ user: req.user._id });
    const completedTasks = await Task.countDocuments({ user: req.user._id, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ user: req.user._id, status: 'Pending' });
    const todayTasks = await Task.countDocuments({ user: req.user._id, date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } });

    const sessionStats = await StudySession.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' }, totalSessions: { $sum: 1 }, avgFocus: { $avg: '$focusScore' } } },
    ]);

    const weeklySessions = await StudySession.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfWeek } } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' } } },
    ]);

    const monthlySessions = await StudySession.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' } } },
    ]);

    const totalHours = sessionStats.length > 0 ? (sessionStats[0].totalMinutes / 60).toFixed(1) : 0;
    const avgFocusScore = sessionStats.length > 0 ? Math.round(sessionStats[0].avgFocus) : 0;
    const weeklyHours = weeklySessions.length > 0 ? (weeklySessions[0].totalMinutes / 60).toFixed(1) : 0;
    const monthlyHours = monthlySessions.length > 0 ? (monthlySessions[0].totalMinutes / 60).toFixed(1) : 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalTasks, completedTasks, pendingTasks, todayTasks,
        totalStudyHours: parseFloat(totalHours),
        weeklyStudyHours: parseFloat(weeklyHours),
        monthlyStudyHours: parseFloat(monthlyHours),
        totalSessions: sessionStats.length > 0 ? sessionStats[0].totalSessions : 0,
        avgFocusScore,
        completionRate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWeeklyActivity = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const sessions = await StudySession.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfWeek } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, hours: { $sum: { $divide: ['$duration', 60] } }, sessions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const tasksByDay = await Task.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfWeek } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, sessions, tasksByDay });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyAnalytics = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth();
    const startOfMonth = new Date(y, m, 1);
    const endOfMonth = new Date(y, m + 1, 1);

    const sessions = await StudySession.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfMonth, $lt: endOfMonth } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, hours: { $sum: { $divide: ['$duration', 60] } }, sessions: { $sum: 1 }, avgFocus: { $avg: '$focusScore' } } },
      { $sort: { _id: 1 } },
    ]);

    const tasksCompleted = await Task.countDocuments({ user: req.user._id, status: 'Completed', date: { $gte: startOfMonth, $lt: endOfMonth } });
    const tasksCreated = await Task.countDocuments({ user: req.user._id, date: { $gte: startOfMonth, $lt: endOfMonth } });
    const totalHours = sessions.reduce((acc, s) => acc + s.hours, 0);
    const avgFocus = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.avgFocus, 0) / sessions.length) : 0;

    res.json({
      success: true,
      monthly: {
        dailySessions: sessions,
        totalHours: parseFloat(totalHours.toFixed(1)),
        totalSessions: sessions.length,
        tasksCompleted,
        tasksCreated,
        completionRate: tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0,
        avgFocusScore: avgFocus,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjectPerformance = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id });

    const performance = await Promise.all(subjects.map(async (subject) => {
      const sessions = await StudySession.aggregate([
        { $match: { user: req.user._id, subject: subject._id } },
        { $group: { _id: null, totalMinutes: { $sum: '$duration' }, sessionsCount: { $sum: 1 }, avgFocus: { $avg: '$focusScore' } } },
      ]);

      const taskCounts = await Task.aggregate([
        { $match: { user: req.user._id, subject: subject.name } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      return {
        _id: subject._id,
        name: subject.name,
        color: subject.color,
        totalHours: sessions.length > 0 ? (sessions[0].totalMinutes / 60).toFixed(1) : 0,
        sessionsCount: sessions.length > 0 ? sessions[0].sessionsCount : 0,
        avgFocus: sessions.length > 0 ? Math.round(sessions[0].avgFocus) : 0,
        tasks: taskCounts,
      };
    }));

    res.json({ success: true, performance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
