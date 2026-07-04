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
    console.log(`[OTP] Send OTP requested for: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.warn(`[OTP] No account found for email: ${normalizedEmail}`);
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const existingOTP = await OTP.findOne({
      email: normalizedEmail,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (existingOTP) {
      const remainingMs = existingOTP.expiresAt.getTime() - Date.now();
      const remainingSec = Math.ceil(remainingMs / 1000);
      console.log(`[OTP] Existing unexpired OTP found for ${normalizedEmail} — expires in ${remainingSec}s`);
      return res.json({
        success: true,
        message: 'OTP already sent. Please check your email or wait for it to expire.',
      });
    }

    await OTP.deleteMany({ email: normalizedEmail, verified: false });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    console.log(`[OTP] Generated OTP for ${normalizedEmail}, expires at ${expiresAt.toISOString()}`);

    await OTP.create({
      email: normalizedEmail,
      otp,
      expiresAt,
    });

    try {
      await sendOTPEmail(normalizedEmail, otp);
      console.log(`[OTP] OTP email sent successfully to ${normalizedEmail}`);
    } catch (emailError) {
      console.error(`[OTP] Email send failed for ${normalizedEmail}: code=${emailError.code} msg=${emailError.message}`);

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
    console.log(`[OTP] Verify OTP for: ${normalizedEmail}`);

    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      console.warn(`[OTP] No OTP record found for ${normalizedEmail}`);
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    console.log(`[OTP] OTP record found — createdAt: ${otpRecord.createdAt}, expiresAt: ${otpRecord.expiresAt}`);

    if (new Date() > otpRecord.expiresAt) {
      console.warn(`[OTP] OTP expired for ${normalizedEmail} — was valid until ${otpRecord.expiresAt}`);
      otpRecord.verified = true;
      await otpRecord.save();
      return res.json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (otpRecord.otp !== trimmedOtp) {
      console.warn(`[OTP] OTP mismatch for ${normalizedEmail} — expected: ${otpRecord.otp}, received: ${trimmedOtp}`);
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    otpRecord.verified = true;
    await otpRecord.save();
    console.log(`[OTP] OTP verified successfully for ${normalizedEmail}`);

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
    console.log(`[OTP] Password reset requested for: ${normalizedEmail}`);

    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      verified: true,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      console.warn(`[OTP] No verified OTP found for ${normalizedEmail} — password reset rejected`);
      return res.status(400).json({ success: false, message: 'Please verify OTP first' });
    }

    if (new Date() > otpRecord.expiresAt) {
      console.warn(`[OTP] Verified OTP has expired for ${normalizedEmail} — password reset rejected`);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      console.warn(`[OTP] User not found for ${normalizedEmail} — password reset rejected`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteMany({ email: normalizedEmail });
    console.log(`[OTP] Password reset successful for ${normalizedEmail}`);

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    console.error('[OTP] resetPassword failed:', error.stack || error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};
