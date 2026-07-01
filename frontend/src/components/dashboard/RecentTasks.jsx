import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaExclamationCircle } from 'react-icons/fa';

const statusIcons = {
  Completed: <FaCheckCircle className="text-success" />,
  'In Progress': <FaClock className="text-secondary" />,
  Pending: <FaExclamationCircle className="text-yellow-500" />,
};

const RecentTasks = ({ tasks = [], onToggle }) => {
  if (!tasks.length) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-500">No tasks for today. Enjoy your free time!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.slice(0, 5).map((task) => (
        <motion.div
          key={task._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4 flex items-center gap-3 group hover:bg-white/[0.05] transition-all"
        >
          <button onClick={() => onToggle?.(task._id)} className="flex-shrink-0">
            {statusIcons[task.status] || statusIcons.Pending}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium text-white truncate ${task.status === 'Completed' ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </p>
            <p className="text-xs text-gray-500">{task.subject || 'No subject'} · {task.durationMinutes}min</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
            task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            {task.priority}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default RecentTasks;
