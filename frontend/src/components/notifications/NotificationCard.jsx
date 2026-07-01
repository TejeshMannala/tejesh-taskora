import { motion } from 'framer-motion';
import { FaBell, FaTrophy, FaCalendar, FaExclamationTriangle, FaCheck, FaTrash } from 'react-icons/fa';

const typeIcons = {
  reminder: <FaBell className="text-yellow-500" />,
  achievement: <FaTrophy className="text-primary" />,
  schedule: <FaCalendar className="text-secondary" />,
  exam: <FaExclamationTriangle className="text-danger" />,
  task: <FaCheck className="text-success" />,
  system: <FaBell className="text-gray-400" />,
};

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 flex items-start gap-3 group transition-all ${
        !notification.read ? 'border-l-2 border-l-primary bg-white/[0.03]' : ''
      }`}
    >
      <div className="p-2 rounded-full bg-white/5 mt-1">
        {typeIcons[notification.type] || typeIcons.system}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm ${notification.read ? 'text-gray-400' : 'text-white font-medium'}`}>
            {notification.title}
          </h4>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {new Date(notification.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
        {!notification.read && (
          <button
            onClick={() => onMarkRead(notification._id)}
            className="mt-2 text-xs text-secondary hover:text-white transition-colors"
          >
            Mark as read
          </button>
        )}
      </div>
      <button
        onClick={() => onDelete(notification._id)}
        className="p-1 text-gray-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
      >
        <FaTrash size={12} />
      </button>
    </motion.div>
  );
};

export default NotificationCard;
