import StudySession from '../models/studySession.model.js';
import User from '../models/user.model.js';

export const saveSession = async (req, res) => {
  try {
    const { subject, subjectName, duration, type, focusScore, notes } = req.body;
    const session = await StudySession.create({
      user: req.user._id,
      subject,
      subjectName,
      duration,
      type: type || 'Focus',
      focusScore: focusScore || 0,
      notes,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalStudyHours: duration / 60 } });

    try {
      await fetch(`http://localhost:${process.env.PORT || 5000}/api/v1/achievements/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization },
      });
    } catch (e) {}

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;

    const sessions = await StudySession.find(query)
      .populate('subject', 'name color')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    const stats = await StudySession.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgFocusScore: { $avg: '$focusScore' },
      }},
    ]);

    res.json({
      success: true,
      sessions,
      stats: stats.length > 0 ? stats[0] : { totalSessions: 0, totalDuration: 0, avgFocusScore: 0 },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await StudySession.find({ user: req.user._id, date: { $gte: today, $lt: tomorrow } });
    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
    const avgFocus = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length) : 0;

    res.json({
      success: true,
      todayStats: { sessions: sessions.length, totalMinutes, totalHours: parseFloat((totalMinutes / 60).toFixed(1)), avgFocusScore: avgFocus },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
