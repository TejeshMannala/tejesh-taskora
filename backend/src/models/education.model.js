import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an education type name'],
      unique: true,
      trim: true,
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

const Education = mongoose.model('Education', educationSchema);
export default Education;
