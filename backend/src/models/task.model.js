import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Please provide task duration in minutes'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    reminders: {
      enabled: { type: Boolean, default: true },
      frequencyMinutes: { type: Number, default: 5 },
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    alarmTriggered: {
      type: Boolean,
      default: false,
    },
    alarmActive: {
      type: Boolean,
      default: false,
    },
    alarmStartedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
