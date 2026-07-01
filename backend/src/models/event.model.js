import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Exam', 'Task', 'Event', 'Reminder', 'Schedule', 'Deadline'],
      default: 'Event',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#7c3aed',
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ user: 1, startDate: -1 });
eventSchema.index({ user: 1, type: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
