import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExclamationTriangle, FaGoogle, FaWifi, FaCheckCircle } from 'react-icons/fa';

const errorConfig = {
  'invalid-email': {
    icon: FaExclamationTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    defaultTitle: 'Invalid Email',
  },
  'duplicate-email': {
    icon: FaExclamationTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    defaultTitle: 'Email Already Registered',
  },
  'google-auth': {
    icon: FaGoogle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    defaultTitle: 'Google Authentication Failed',
  },
  'network': {
    icon: FaWifi,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    defaultTitle: 'Network Error',
  },
  'success': {
    icon: FaCheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    defaultTitle: 'Success',
  },
  'default': {
    icon: FaExclamationTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    defaultTitle: 'Error',
  },
};

const ErrorModal = ({ isOpen, onClose, type = 'default', title, message, action }) => {
  const config = errorConfig[type] || errorConfig.default;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`relative w-full max-w-md glass-card p-8 ${config.borderColor} border-2`}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className={`w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mb-5 ${config.color}`}
              >
                <motion.div
                  animate={type === 'success' ? { rotate: [0, 360] } : { scale: [1, 1.1, 1] }}
                  transition={{ duration: type === 'success' ? 0.6 : 0.3 }}
                >
                  <Icon size={40} />
                </motion.div>
              </motion.div>

              <h3 className="text-xl font-bold text-white mb-2">{title || config.defaultTitle}</h3>

              {message && (
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
              )}

              {action && (
                <button
                  onClick={action.onClick}
                  className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${action.className || 'bg-primary hover:bg-accent text-white'}`}
                >
                  {action.label}
                </button>
              )}

              {!action && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg font-medium text-sm bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ErrorModal;
