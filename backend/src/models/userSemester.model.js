import mongoose from 'mongoose';

const userSemesterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
  },
  status: {
    type: String,
    enum: ['locked', 'active', 'completed'],
    default: 'locked',
  },
  completionPercentage: {
    type: Number,
    default: 0,
  },
  subjectCount: {
    type: Number,
    default: 0,
  },
  completedSubjectCount: {
    type: Number,
    default: 0,
  },
  completedSyllabusCount: {
    type: Number,
    default: 0,
  },
  startedAt: Date,
  completedAt: Date,
}, {
  timestamps: true,
});

userSemesterSchema.index({ user: 1, semester: 1 }, { unique: true });

const UserSemester = mongoose.model('UserSemester', userSemesterSchema);
export default UserSemester;
