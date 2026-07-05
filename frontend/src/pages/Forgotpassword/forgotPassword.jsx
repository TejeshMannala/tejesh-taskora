import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSpinner, FaCheckCircle, FaTimesCircle, FaEnvelope, FaLock,
  FaEye, FaEyeSlash, FaArrowLeft, FaArrowRight, FaLockOpen, FaShieldAlt, FaRedo,
} from 'react-icons/fa';
import { authApi } from '../../services/authApi';

const STEP_EMAIL = 'email';
const STEP_OTP = 'otp';
const STEP_RESET = 'reset';
const STEP_SUCCESS = 'success';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startResendCooldown = (seconds = 30) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }, []);

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSendOTP = async () => {
    if (!email.trim()) { showMessage('Please enter your email address', 'error'); return; }
    if (!validEmail(email.trim())) { showMessage('Please enter a valid email address', 'error'); return; }
    setLoading(true);
    try {
      const data = await authApi.sendOTP(email.trim());
      if (data.success) {
        setStep(STEP_OTP);
        startResendCooldown(30);
        const msg = data.otp ? `OTP: ${data.otp} (dev mode)` : 'A 6-digit OTP has been sent to your email';
        showMessage(msg, 'success');
      } else {
        showMessage(data.message || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        showMessage('Request timed out. Please check your connection and try again.', 'error');
      } else {
        showMessage(err.response?.data?.message || 'Failed to send OTP. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) { showMessage('Please enter the complete 6-digit OTP', 'error'); return; }
    setLoading(true);
    try {
      const data = await authApi.verifyOTP(email.trim(), otp.trim());
      if (data.success && data.verified) {
        setOtpVerified(true);
        showMessage('OTP verified successfully', 'success');
      } else {
        showMessage(data.message || 'Invalid or expired OTP', 'error');
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to verify OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) { showMessage('Please enter a new password', 'error'); return; }
    if (newPassword.length < 6) { showMessage('Password must be at least 6 characters', 'error'); return; }
    setLoading(true);
    try {
      const data = await authApi.resetPassword(email.trim(), otp.trim(), newPassword.trim());
      if (data.success) {
        setStep(STEP_SUCCESS);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        showMessage(data.message || 'Failed to reset password', 'error');
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-background to-gray-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 p-8 md:p-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <FaLockOpen className="text-white text-xl" />
          </div>

          <div className="text-center mt-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {step === STEP_EMAIL && 'Forgot Password'}
              {step === STEP_OTP && 'Verify OTP'}
              {step === STEP_RESET && 'Reset Password'}
              {step === STEP_SUCCESS && 'Password Reset!'}
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              {step === STEP_EMAIL && 'Enter your registered email and we will send you a 6-digit OTP to reset your password.'}
              {step === STEP_OTP && !otpVerified && `A verification code has been sent to`}
              {step === STEP_OTP && !otpVerified && <span className="block font-medium text-gray-200 mt-1">{email}</span>}
              {step === STEP_OTP && otpVerified && 'Your OTP has been verified. Continue to reset your password.'}
              {step === STEP_RESET && 'Choose a strong new password for your account.'}
              {step === STEP_SUCCESS && 'Your password has been changed successfully. Redirecting to login...'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {message.text && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className={`flex items-center gap-3 p-3.5 rounded-xl mb-6 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/15 text-green-300 border border-green-500/25'
                    : 'bg-red-500/15 text-red-300 border border-red-500/25'
                }`}
              >
                {message.type === 'success'
                  ? <FaCheckCircle className="shrink-0 text-green-400" />
                  : <FaTimesCircle className="shrink-0 text-red-400" />
                }
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === STEP_EMAIL && (
              <motion.div
                key="email"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <label htmlFor="reset-email" className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendOTP()}
                      disabled={loading}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full py-3 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading || !email.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><FaSpinner className="animate-spin" /> Sending OTP...</>
                  ) : (
                    <>Send OTP <FaArrowRight size={14} /></>
                  )}
                </button>
              </motion.div>
            )}

            {step === STEP_OTP && (
              <motion.div
                key="otp"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                {!otpVerified ? (
                  <>
                    <div>
                      <label htmlFor="reset-otp" className="block text-gray-300 text-sm font-medium mb-2">
                        Enter OTP
                      </label>
                      <input
                        id="reset-otp"
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && handleVerifyOTP()}
                        disabled={loading}
                        placeholder="000000"
                        autoComplete="one-time-code"
                        className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none text-center text-2xl tracking-[10px] focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all disabled:opacity-50"
                      />
                    </div>
                    <button
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length !== 6}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <><FaSpinner className="animate-spin" /> Verifying...</>
                      ) : (
                        <>Verify OTP <FaShieldAlt size={14} /></>
                      )}
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-5"
                  >
                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-green-400 text-3xl" />
                    </div>
                    <p className="text-green-300 font-semibold">OTP Verified Successfully</p>
                    <button
                      onClick={() => setStep(STEP_RESET)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                      Continue <FaArrowRight size={14} />
                    </button>
                  </motion.div>
                )}
                {!otpVerified && (resendCooldown > 0 ? (
                  <p className="text-center text-gray-500 text-sm">
                    Resend OTP in <span className="text-gray-300 font-medium">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={async () => {
                      setOtp('');
                      setLoading(true);
                      try {
                        const data = await authApi.sendOTP(email.trim());
                        if (data.success) {
                          startResendCooldown(30);
                          showMessage('OTP resent successfully', 'success');
                        } else {
                          showMessage(data.message || 'Failed to resend OTP', 'error');
                        }
                      } catch (err) {
                        showMessage('Failed to resend OTP. Please try again.', 'error');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <FaRedo size={12} /> Resend OTP
                  </button>
                ))}
                <button
                  onClick={() => { setStep(STEP_EMAIL); setOtp(''); setOtpVerified(false); }}
                  className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <FaArrowLeft size={12} /> Change email address
                </button>
              </motion.div>
            )}

            {step === STEP_RESET && (
              <motion.div
                key="reset"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <label htmlFor="new-password" className="block text-gray-300 text-sm font-medium mb-2">
                    New Password
                  </label>
                  <div className="relative group">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !loading && handleResetPassword()}
                      disabled={loading}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      className="w-full py-3 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-red-400 text-xs mt-1.5">Password must be at least 6 characters</p>
                  )}
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={loading || newPassword.length < 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><FaSpinner className="animate-spin" /> Resetting...</>
                  ) : (
                    <>Reset Password <FaArrowRight size={14} /></>
                  )}
                </button>
                <button
                  onClick={() => { setStep(STEP_OTP); setNewPassword(''); }}
                  className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <FaArrowLeft size={12} /> Back to OTP verification
                </button>
              </motion.div>
            )}

            {step === STEP_SUCCESS && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-5"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <FaCheckCircle className="text-green-400 text-4xl" />
                </motion.div>
                <div>
                  <p className="text-green-300 font-semibold text-lg">Password Reset Complete</p>
                  <p className="text-gray-400 text-sm mt-1">You will be redirected to login shortly.</p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="w-6 h-6 mx-auto"
                >
                  <FaSpinner className="text-primary text-xl" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              <FaArrowLeft size={12} /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
