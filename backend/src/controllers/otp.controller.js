import OTP from '../models/otp.model.js';
import User from '../models/user.model.js';
import { sendOTPEmail } from '../services/email.service.js';
import { generateOTP } from '../utils/generateOTP.js';

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    await OTP.deleteMany({ email: normalizedEmail, verified: false });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({
      email: normalizedEmail,
      otp,
      expiresAt,
    });

    try {
      await sendOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error('[OTP] Email send failed: code=' + emailError.code + ' msg=' + emailError.message);

      await OTP.deleteMany({ email: normalizedEmail, otp });

      let msg;
      if (emailError.message?.includes('535') || emailError.message?.includes('Invalid login')) {
        msg = 'Failed to send OTP. Gmail rejected the App Password. Generate a new one at https://myaccount.google.com/apppasswords and update MAIL_PASS in .env';
      } else if (emailError.message?.includes('Missing credentials')) {
        msg = 'Failed to send OTP. MAIL_USER or MAIL_PASS is missing in backend/.env.';
      } else {
        msg = 'Failed to send OTP email. Check SMTP configuration.';
      }
      return res.status(500).json({ success: false, message: msg });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      ...(process.env.NODE_ENV !== 'production' && { otp, note: 'OTP visible only in dev mode' }),
    });
  } catch (error) {
    console.error('[OTP] sendOTP unexpected error:', error.stack || error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > otpRecord.expiresAt) {
      otpRecord.verified = true;
      await otpRecord.save();
      return res.json({ success: false, message: 'OTP expired' });
    }

    if (otpRecord.otp !== trimmedOtp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    res.json({
      success: true,
      verified: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('[OTP] verifyOTP failed:', error.stack || error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email?.trim() || !otp?.trim() || !newPassword?.trim()) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      verified: true,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Please verify OTP first' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteMany({ email: normalizedEmail });

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    console.error('[OTP] resetPassword failed:', error.stack || error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};
