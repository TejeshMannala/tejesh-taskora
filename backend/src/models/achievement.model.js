import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: '🏆',
    },
    category: {
      type: String,
      enum: ['streak', 'tasks', 'hours', 'focus', 'early_bird', 'night_owl', 'milestone', 'special'],
      required: true,
    },
    criteria: {
      type: {
        type: String,
        enum: ['streak_days', 'tasks_completed', 'study_hours', 'sessions_count', 'early_session', 'night_session', 'custom'],
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
    },
    xpReward: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
