import { motion } from 'framer-motion';
import { FaClock, FaCheck, FaTrash } from 'react-icons/fa';

const ScheduleCard = ({ schedule, onComplete, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-4 flex items-center gap-4 group hover:bg-white/[0.08] transition-all"
    >
      <button
        onClick={() => onComplete?.(schedule._id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${schedule.status === 'Completed' ? 'bg-success border-success' : 'border-gray-500 hover:border-primary'}`}
      >
        {schedule.status === 'Completed' && <FaCheck size={12} className="text-white" />}
      </button>

      <div className="flex-1">
        <h4 className="font-medium text-white">{schedule.subject || 'Study Session'}</h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><FaClock size={10} /> {schedule.duration || schedule.durationMinutes}min</span>
          <span>{new Date(schedule.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <button onClick={() => onDelete?.(schedule._id)} className="p-2 text-gray-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
        <FaTrash size={14} />
      </button>
    </motion.div>
  );
};

export default ScheduleCard;
