import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    subjectName: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    type: {
      type: String,
      enum: ['Focus', 'Pomodoro', 'Study'],
      default: 'Focus',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    focusScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.index({ user: 1, date: -1 });
studySessionSchema.index({ user: 1, subject: 1 });

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;
