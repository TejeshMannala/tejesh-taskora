import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaGraduationCap } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { acceptAgreement } from '../../redux/slices/authSlice';

const AgreementPopup = () => {
  const [agreed, setAgreed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!agreed) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2000);
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(acceptAgreement()).unwrap();
      toast.success('Welcome to Taskora!');
      navigate('/profile');
    } catch (err) {
      toast.error(err?.message || err || 'Failed to accept agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="glass-card max-w-lg w-full p-8 text-center relative overflow-hidden"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-6xl mb-4 flex justify-center"
        >
          <FaGraduationCap className="text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Welcome to Taskora
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 mb-6"
        >
          Before continuing, please read and accept the student agreement.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-5 mb-6 text-left space-y-3"
        >
          {[
            'I understand that Taskora will send reminders for incomplete tasks.',
            'I agree to receive notifications for deadlines and updates.',
            'I agree to follow the productivity guidelines and academic policies.',
          ].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-start gap-3"
            >
              <FaCheckCircle className="text-success mt-0.5 flex-shrink-0" size={16} />
              <p className="text-gray-300 text-sm">{text}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                agreed
                  ? 'bg-success border-success'
                  : 'border-white/30 group-hover:border-white/50'
              }`}
            >
              {agreed && <FaCheckCircle className="text-white" size={14} />}
            </div>
            <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
              I agree to the terms and continue.
            </span>
          </label>
        </motion.div>

        <AnimatePresence>
          {showWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 text-yellow-400 text-sm mb-4"
            >
              <FaExclamationTriangle />
              <span>Please accept the agreement before continuing.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAccept}
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-primary hover:bg-accent text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
          ) : (
            'Continue to Profile'
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default AgreementPopup;
