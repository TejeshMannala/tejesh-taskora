import { motion } from 'framer-motion';
import { FaTrash, FaEdit, FaCheck, FaUndo, FaClock, FaFlag } from 'react-icons/fa';

const priorityColors = {
  Low: 'border-l-green-500',
  Medium: 'border-l-yellow-500',
  High: 'border-l-red-500',
};

const priorityFlags = {
  Low: <FaFlag className="text-green-500" size={12} />,
  Medium: <FaFlag className="text-yellow-500" size={12} />,
  High: <FaFlag className="text-red-500" size={12} />,
};

const TaskCard = ({ task, onToggle, onEdit, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`glass-card p-4 border-l-4 ${priorityColors[task.priority] || 'border-l-primary'} 
        ${task.status === 'Completed' ? 'opacity-60' : ''} group hover:bg-white/[0.08] transition-all`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(task._id)}
          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
            ${task.status === 'Completed' ? 'bg-success border-success' : 'border-gray-500 hover:border-primary'}`}
        >
          {task.status === 'Completed' && <FaCheck size={10} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-white truncate ${task.status === 'Completed' ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            {priorityFlags[task.priority]}
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            {task.subject && <span className="px-2 py-0.5 rounded-full bg-white/5">{task.subject}</span>}
            <span className="flex items-center gap-1">
              <FaClock size={10} />
              {task.durationMinutes}min
            </span>
            {task.date && (
              <span>{new Date(task.date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-secondary transition-colors">
            <FaEdit size={14} />
          </button>
          <button onClick={() => onDelete(task._id)} className="p-2 text-gray-400 hover:text-danger transition-colors">
            <FaTrash size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
