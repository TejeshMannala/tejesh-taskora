import mongoose from 'mongoose';

const studyStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalStudyHours: {
      type: Number,
      default: 0,
    },
    weeklyStudyHours: {
      type: Number,
      default: 0,
    },
    monthlyStudyHours: {
      type: Number,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    tasksPending: {
      type: Number,
      default: 0,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    avgFocusScore: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    dailyStreak: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
    achievementsUnlocked: {
      type: Number,
      default: 0,
    },
    subjectProgress: [{
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      subjectName: String,
      totalHours: { type: Number, default: 0 },
      completedHours: { type: Number, default: 0 },
      progressPercent: { type: Number, default: 0 },
    }],
    weeklyActivity: [{
      date: Date,
      hours: { type: Number, default: 0 },
      tasksDone: { type: Number, default: 0 },
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const StudyStats = mongoose.model('StudyStats', studyStatsSchema);
export default StudyStats;
