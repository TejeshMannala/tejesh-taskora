import mongoose from 'mongoose';

const weekSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  topics: [{
    type: String,
    trim: true,
  }],
  completed: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const roadmapSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SharedSubject',
      required: true,
      unique: true,
    },
    weeks: [weekSchema],
  },
  {
    timestamps: true,
  }
);

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;
