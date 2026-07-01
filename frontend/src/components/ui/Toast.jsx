import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type }) => {
  const isError = type === 'error';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-lg flex items-center gap-3 ${
          isError 
            ? 'bg-red-500/10 border-red-500/50 text-red-100' 
            : 'bg-green-500/10 border-green-500/50 text-green-100'
        }`}
      >
        <span className="text-2xl">{isError ? '⚠️' : '✅'}</span>
        <p className="font-medium text-lg">{message}</p>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;
