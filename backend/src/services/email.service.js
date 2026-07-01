import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.MAIL_USER || process.env.SMTP_USER;
  const pass = process.env.MAIL_PASS || process.env.SMTP_PASS;

  // console.log('[EmailService] Creating transporter with user:', user || 'NOT FOUND');
  // console.log('[EmailService] Password present:', pass ? 'YES' : 'NO');
  // console.log('[EmailService] Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
  // console.log('[EmailService] Port:', process.env.SMTP_PORT || '587');

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  return transporter;
};

export const verifyTransporter = async () => {
  try {
    const t = getTransporter();
    await t.verify();
    console.log('[EmailService] SMTP Connected — Gmail credentials are valid');
    return true;
  } catch (error) {
    console.error('[EmailService] SMTP Verification FAILED');
    console.error('[EmailService] Error code:', error.code || 'N/A');
    console.error('[EmailService] Error response:', error.response || 'N/A');
    console.error('[EmailService] Error command:', error.command || 'N/A');
    console.error('[EmailService] Full message:', error.message);
    console.error('[EmailService] Stack:', error.stack || error);
    return false;
  }
};

export const sendOTPEmail = async (email, otp) => {
  console.log('[EmailService] Sending OTP to:', email);
  const t = getTransporter();
  const user = process.env.MAIL_USER || process.env.SMTP_USER;
  try {
    const info = await t.sendMail({
      from: `"Taskora" <${user || 'noreply@taskora.com'}>`,
      to: email,
      subject: 'Taskora Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1f2937; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hello Student,</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Your OTP for password reset is:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #7c3aed; background: #ede9fe; padding: 12px 24px; border-radius: 8px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">This OTP expires in <strong>5 minutes</strong>.</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Taskora &mdash; Your Study Companion</p>
        </div>
      `,
    });
    console.log('[EmailService] OTP email sent, messageId:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EmailService] Failed to send OTP email');
    console.error('[EmailService] Error code:', error.code || 'N/A');
    console.error('[EmailService] Error response:', error.response || 'N/A');
    console.error('[EmailService] Full message:', error.message);
    console.error('[EmailService] Stack:', error.stack || error);
    throw error;
  }
};
