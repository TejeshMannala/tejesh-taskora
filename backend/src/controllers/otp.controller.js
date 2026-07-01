import OTP from '../models/otp.model.js';
import User from '../models/user.model.js';
import { sendOTPEmail } from '../services/email.service.js';
import { generateOTP } from '../utils/generateOTP.js';

export const sendOTP = async (req, res) => {
  try {
    console.log('[OTP] sendOTP called with body:', req.body);
    console.log('[OTP] MAIL_USER:', process.env.MAIL_USER ? 'SET' : 'MISSING');
    console.log('[OTP] MAIL_PASS:', process.env.MAIL_PASS ? 'SET' : 'MISSING');
    console.log('[OTP] SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'MISSING');
    console.log('[OTP] SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'MISSING');

    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('[OTP] Normalized email:', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('[OTP] No user found for:', normalizedEmail);
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }
    console.log('[OTP] User found:', user._id);

    await OTP.deleteMany({ email: normalizedEmail, verified: false });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    console.log('[OTP] Generated OTP:', otp, 'expires at:', expiresAt);

    await OTP.create({
      email: normalizedEmail,
      otp,
      expiresAt,
    });

    console.log('[OTP] OTP saved to DB for:', normalizedEmail);

    try {
      await sendOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error('[OTP] Email send failed — removing OTP record');
      console.error('[OTP] Error code:', emailError.code || 'N/A');
      console.error('[OTP] Error response:', emailError.response || 'N/A');
      console.error('[OTP] Error command:', emailError.command || 'N/A');
      console.error('[OTP] Error message:', emailError.message);
      console.error('[OTP] Stack:', emailError.stack || emailError);

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
    console.log('[OTP] verifyOTP called with body:', req.body);
    const { email, otp } = req.body;
    console.log('[OTP] Email from body:', email);
    console.log('[OTP] OTP from body:', otp);

    if (!email?.trim() || !otp?.trim()) {
      console.log('[OTP] Missing email or OTP');
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();
    console.log('[OTP] Normalized email:', normalizedEmail);
    console.log('[OTP] Trimmed OTP:', trimmedOtp);

    console.log('[OTP] Querying OTP records for:', normalizedEmail);
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      console.log('[OTP] No OTP record found for:', normalizedEmail);
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    console.log('[OTP] Found OTP record — stored OTP:', otpRecord.otp, '| expiresAt:', otpRecord.expiresAt);
    console.log('[OTP] Current time:', new Date());
    console.log('[OTP] Is expired?', new Date() > otpRecord.expiresAt);

    if (new Date() > otpRecord.expiresAt) {
      console.log('[OTP] OTP expired for:', normalizedEmail);
      otpRecord.verified = true;
      await otpRecord.save();
      return res.json({ success: false, message: 'OTP expired' });
    }

    console.log('[OTP] Comparing — input OTP:', `"${trimmedOtp}"`, '| stored OTP:', `"${otpRecord.otp}"`, '| match:', trimmedOtp === otpRecord.otp);

    if (otpRecord.otp !== trimmedOtp) {
      console.log('[OTP] OTP mismatch for:', normalizedEmail);
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    console.log('[OTP] OTP verified successfully for:', normalizedEmail);

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
    console.log('[OTP] resetPassword called with body:', req.body);
    const { email, otp, newPassword } = req.body;
    console.log('[OTP] Email:', email);
    console.log('[OTP] OTP present:', !!otp);
    console.log('[OTP] New password present:', !!newPassword);

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
      console.log('[OTP] No verified OTP record found for:', normalizedEmail);
      return res.status(400).json({ success: false, message: 'Please verify OTP first' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteMany({ email: normalizedEmail });

    console.log('[OTP] Password reset successful for:', normalizedEmail);

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    console.error('[OTP] resetPassword failed:', error.stack || error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};
