import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    color: {
      type: String,
      default: '#7c3aed',
    },
    icon: {
      type: String,
      default: 'book',
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    completedHours: {
      type: Number,
      default: 0,
    },
    targetHours: {
      type: Number,
      default: 40,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ user: 1, name: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
