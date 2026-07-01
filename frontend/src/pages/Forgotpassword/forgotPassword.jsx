import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { authApi } from "../../services/authApi";
import BackButton from "../../components/ui/BackButton";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 5000);
  };

  const handleSendOTP = async () => {
    console.log("Email:", email);
    if (!email.trim()) {
      showMessage("Please enter your email", "error");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await authApi.sendOTP(email.trim());
      console.log("OTP send response:", data);
      if (data.success) {
        setEmailSent(true);
        setStep("otp");
        const msg = data.otp ? `OTP: ${data.otp} (dev mode)` : "OTP sent to your email";
        showMessage(msg, "success");
      } else {
        showMessage(data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      if (err.code === 'ECONNABORTED') {
        showMessage("Request timed out. Is the backend server running on port 5000?", "error");
      } else {
        showMessage(err.response?.data?.message || "Failed to send OTP. Check your email.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    console.log("OTP:", otp);
    if (!otp.trim() || otp.length !== 6) {
      showMessage("Please enter a valid 6-digit OTP", "error");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await authApi.verifyOTP(email.trim(), otp.trim());
      console.log("OTP verify response:", data);
      if (data.success && data.verified) {
        setOtpVerified(true);
        showMessage("OTP verified successfully", "success");
      } else {
        showMessage(data.message || "Invalid OTP", "error");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      showMessage(err.response?.data?.message || "Failed to verify OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (otpVerified) {
      setStep("reset");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await authApi.resetPassword(email.trim(), otp.trim(), newPassword.trim());
      console.log("Reset password response:", data);
      if (data.success) {
        showMessage("Password reset successfully! Redirecting to login...", "success");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        showMessage(data.message || "Failed to reset password", "error");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      showMessage(err.response?.data?.message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-900 p-4 relative overflow-hidden">
      <BackButton to="/dashboard" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.15),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-6">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {step === "email" && "Forgot Password"}
              {step === "otp" && "Enter OTP"}
              {step === "reset" && "Reset Password"}
            </motion.h1>
            <p className="text-gray-300 text-sm">
              {step === "email" && "Enter your registered email to receive an OTP"}
              {step === "otp" && `OTP sent to ${email}`}
              {step === "reset" && "Enter your new password"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${
                  messageType === "success" ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {messageType === "success" ? <FaCheckCircle className="shrink-0" /> : <FaTimesCircle className="shrink-0" />}
                <span className="text-sm">{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {step === "email" && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-white text-sm mb-2">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    disabled={emailSent || loading}
                    placeholder="Enter your email"
                    className="w-full p-3 pl-10 rounded-xl outline-none border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading || !email.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all p-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <><FaSpinner className="animate-spin" /> Sending OTP...</> : "Verify Email"}
              </button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {!otpVerified ? (
                <>
                  <div>
                    <label className="block text-white text-sm mb-2">Enter OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                      placeholder="Enter 6-digit OTP"
                      className="w-full p-3 rounded-xl outline-none border border-white/20 bg-white/10 text-white placeholder-gray-400 text-center text-2xl tracking-[8px] focus:border-purple-400 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all p-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <><FaSpinner className="animate-spin" /> Verifying...</> : "Verify OTP"}
                  </button>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-3" />
                  <p className="text-green-300 font-semibold mb-6">OTP Verified Successfully</p>
                  <button
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all p-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                  >
                    Continue <FaArrowRight size={14} />
                  </button>
                </motion.div>
              )}
              <button
                onClick={() => { setStep("email"); setOtp(""); setMessage(""); setOtpVerified(false); }}
                className="w-full text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-1"
              >
                <FaArrowLeft size={12} /> Change email
              </button>
            </motion.div>
          )}

          {step === "reset" && (
            <motion.div
              key="reset-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-white text-sm mb-2">New Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full p-3 pl-10 pr-10 rounded-xl outline-none border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-purple-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={loading || newPassword.length < 6}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all p-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <><FaSpinner className="animate-spin" /> Resetting...</> : "Reset Password"}
              </button>
              <button
                onClick={() => { setStep("otp"); setNewPassword(""); setMessage(""); }}
                className="w-full text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-1"
              >
                <FaArrowLeft size={12} /> Back to OTP
              </button>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
