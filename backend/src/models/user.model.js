import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    college: {
      type: String,
      trim: true,
    },
    university: {
      type: String,
      trim: true,
    },

    studyGoals: [
      {
        type: String,
        trim: true,
      },
    ],
    googleId: {
      type: String,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    hasAcceptedTerms: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    avatar: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    educationType: {
      type: String,
    },
    year: {
      type: String,
    },
    joiningYear: {
      type: Number,
    },
    endingYear: {
      type: Number,
    },
    studyStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    totalStudyHours: {
      type: Number,
      default: 0,
    },
    productivityScore: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    academicYear: {
      type: String,
      trim: true,
    },
    profileLocked: {
      type: Boolean,
      default: false,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    achievements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
      },
    ],
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    hasAcceptedAgreement: {
      type: Boolean,
      default: false,
    },
    acceptedAgreementAt: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
