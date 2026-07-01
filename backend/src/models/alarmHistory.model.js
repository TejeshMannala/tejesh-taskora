import mongoose from 'mongoose';

const alarmHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

alarmHistorySchema.index({ user: 1, task: 1 });
alarmHistorySchema.index({ user: 1, triggeredAt: -1 });

const AlarmHistory = mongoose.model('AlarmHistory', alarmHistorySchema);
export default AlarmHistory;
