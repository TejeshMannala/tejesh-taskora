import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  educationType: {
    type: String,
    required: true,
    trim: true,
  },
  yearNumber: {
    type: Number,
    required: true,
  },
  semesterNumber: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

semesterSchema.index({ educationType: 1, semesterNumber: 1 }, { unique: true });

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;
