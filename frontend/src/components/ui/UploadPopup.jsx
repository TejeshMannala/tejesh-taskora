import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaUpload } from 'react-icons/fa';

const UploadPopup = ({ isOpen, status, message, progress }) => {
  const statusConfig = {
    uploading: {
      icon: <FaUpload className="text-primary" size={28} />,
      spinner: <FaSpinner className="animate-spin text-primary" size={28} />,
      title: 'Uploading profile picture...',
    },
    success: {
      icon: <FaCheckCircle className="text-green-400" size={28} />,
      spinner: null,
      title: message || 'Profile picture updated successfully',
    },
    error: {
      icon: <FaExclamationCircle className="text-red-400" size={28} />,
      spinner: null,
      title: message || 'Upload failed',
    },
  };

  const config = statusConfig[status] || statusConfig.uploading;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-sm glass-card p-8 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {status === 'uploading' ? (
                  <div className="relative">
                    {config.icon}
                    <div className="absolute -top-1 -right-1">{config.spinner}</div>
                  </div>
                ) : (
                  <div className={`p-3 rounded-full ${
                    status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {config.icon}
                  </div>
                )}
              </div>

              <p className="text-white font-medium text-lg">{config.title}</p>

              {status === 'uploading' && (
                <div className="w-full space-y-2">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                  <p className="text-gray-400 text-sm">{Math.round(progress)}%</p>
                </div>
              )}

              {status === 'uploading' && (
                <p className="text-gray-500 text-sm">Please wait while we upload your image</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadPopup;
