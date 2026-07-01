import Achievement from '../models/achievement.model.js';
import User from '../models/user.model.js';

const DEFAULT_ACHIEVEMENTS = [
  { name: 'First Steps', description: 'Complete your first task', icon: '🌱', category: 'tasks', criteria: { type: 'tasks_completed', value: 1 }, xpReward: 10 },
  { name: 'Getting Started', description: 'Study for 1 hour total', icon: '⏱️', category: 'hours', criteria: { type: 'study_hours', value: 1 }, xpReward: 20 },
  { name: 'Task Master', description: 'Complete 10 tasks', icon: '✅', category: 'tasks', criteria: { type: 'tasks_completed', value: 10 }, xpReward: 50 },
  { name: 'Dedicated Learner', description: 'Study for 10 hours total', icon: '📚', category: 'hours', criteria: { type: 'study_hours', value: 10 }, xpReward: 100 },
  { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', criteria: { type: 'streak_days', value: 7 }, xpReward: 150 },
  { name: 'Century Mark', description: 'Complete 100 tasks', icon: '💯', category: 'tasks', criteria: { type: 'tasks_completed', value: 100 }, xpReward: 500 },
  { name: 'Marathon Runner', description: 'Study for 100 hours total', icon: '🎯', category: 'hours', criteria: { type: 'study_hours', value: 100 }, xpReward: 1000 },
  { name: 'Month Master', description: 'Maintain a 30-day streak', icon: '👑', category: 'streak', criteria: { type: 'streak_days', value: 30 }, xpReward: 2000 },
  { name: 'Early Bird', description: 'Complete 10 study sessions before 8 AM', icon: '🌅', category: 'early_bird', criteria: { type: 'early_session', value: 10 }, xpReward: 100 },
  { name: 'Night Owl', description: 'Complete 10 study sessions after 10 PM', icon: '🦉', category: 'night_owl', criteria: { type: 'night_session', value: 10 }, xpReward: 100 },
  { name: 'Focus Master', description: 'Achieve 100% focus score in 5 sessions', icon: '🧠', category: 'focus', criteria: { type: 'sessions_count', value: 5 }, xpReward: 200 },
  { name: 'Top Performer', description: 'Complete all tasks for an entire week', icon: '⭐', category: 'milestone', criteria: { type: 'custom', value: 1 }, xpReward: 300 },
];

export const seedAchievements = async (req, res) => {
  try {
    for (const ach of DEFAULT_ACHIEVEMENTS) {
      await Achievement.findOneAndUpdate({ name: ach.name }, ach, { upsert: true, returnDocument: 'after' });
    }
    res.json({ success: true, message: 'Achievements seeded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAchievements = async (req, res) => {
  try {
    const allAchievements = await Achievement.find().sort({ xpReward: 1 });
    const user = await User.findById(req.user._id).populate('achievements');

    const userAchievementIds = (user.achievements || []).map(a => a._id.toString());

    const achievements = allAchievements.map(ach => ({
      ...ach.toObject(),
      unlocked: userAchievementIds.includes(ach._id.toString()),
    }));

    res.json({ success: true, achievements, unlockedCount: user.achievements?.length || 0, totalCount: allAchievements.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const allAchievements = await Achievement.find();
    const unlockedIds = (user.achievements || []).map(a => a.toString());
    const newlyUnlocked = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.includes(achievement._id.toString())) continue;

      let earned = false;

      switch (achievement.criteria.type) {
        case 'tasks_completed': {
          const { default: Task } = await import('../models/task.model.js');
          const count = await Task.countDocuments({ user: req.user._id, status: 'Completed' });
          if (count >= achievement.criteria.value) earned = true;
          break;
        }
        case 'study_hours': {
          const { default: StudySession } = await import('../models/studySession.model.js');
          const sessions = await StudySession.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: null, totalMinutes: { $sum: '$duration' } } },
          ]);
          const hours = sessions.length > 0 ? sessions[0].totalMinutes / 60 : 0;
          if (hours >= achievement.criteria.value) earned = true;
          break;
        }
        case 'streak_days': {
          if ((user.studyStreak || 0) >= achievement.criteria.value) earned = true;
          break;
        }
        case 'early_session': {
          const { default: StudySession } = await import('../models/studySession.model.js');
          const count = await StudySession.countDocuments({
            user: req.user._id,
            date: { $gte: new Date(new Date().setHours(0,0,0,0)) },
          });
          break;
        }
        default:
          break;
      }

      if (earned) {
        user.achievements.push(achievement._id);
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      await user.save();
      const { default: Notification } = await import('../models/notification.model.js');
      for (const ach of newlyUnlocked) {
        await Notification.create({
          user: req.user._id,
          title: 'Achievement Unlocked!',
          message: `You earned "${ach.name}" - ${ach.description}`,
          type: 'achievement',
          priority: 'high',
          metadata: { achievementId: ach._id, icon: ach.icon },
        });
      }
    }

    res.json({ success: true, newlyUnlocked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
