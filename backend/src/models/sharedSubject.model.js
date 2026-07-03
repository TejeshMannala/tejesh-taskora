import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
    },
    description: {
      type: String,
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ name: 1, group: 1 }, { unique: true });

const SharedSubject = mongoose.model('SharedSubject', subjectSchema);
export default SharedSubject;
