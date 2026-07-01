import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';

const ReminderPopup = ({ reminders = [], onDismiss, onComplete }) => {
  return (
    <AnimatePresence>
      {reminders.map((reminder) => (
        <motion.div
          key={reminder._id}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 glass-card p-5 max-w-sm border-l-4 border-l-danger"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-danger/20 rounded-full text-danger">
              <FaBell size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">{reminder.title || 'Reminder'}</h4>
              <p className="text-gray-400 text-xs mt-1">{reminder.message}</p>
            </div>
            <button onClick={() => onDismiss(reminder._id)} className="text-gray-500 hover:text-white">
              <FaTimes size={14} />
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onComplete?.(reminder.metadata?.taskId)}
              className="flex-1 px-4 py-2 rounded-lg bg-success/20 text-success text-sm font-medium hover:bg-success/30 transition-all"
            >
              <FaCheck size={12} className="inline mr-1" /> Complete
            </button>
            <button
              onClick={() => onDismiss(reminder._id)}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default ReminderPopup;
