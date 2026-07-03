import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true,
    },
    educationType: {
      type: String,
      required: true,
    },
    education: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Education',
    },
    description: {
      type: String,
      trim: true,
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

groupSchema.index({ name: 1, educationType: 1 }, { unique: true });

const Group = mongoose.model('Group', groupSchema);
export default Group;
