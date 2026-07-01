import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      required: true,
    },
    date: {
      type: Date, // Represents the specific day, start of the week, or start of the month
      required: true,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
