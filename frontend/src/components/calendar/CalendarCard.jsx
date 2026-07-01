import { motion } from 'framer-motion';

const typeColors = {
  Exam: 'bg-danger/20 text-danger border-danger/30',
  Task: 'bg-primary/20 text-primary border-primary/30',
  Event: 'bg-secondary/20 text-secondary border-secondary/30',
  Reminder: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  Schedule: 'bg-success/20 text-success border-success/30',
  Deadline: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const CalendarCard = ({ event, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 2 }}
      onClick={() => onClick?.(event)}
      className={`glass-card p-3 border-l-4 ${event.color ? `border-l-[${event.color}]` : 'border-l-primary'} cursor-pointer group`}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white text-sm truncate">{event.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[event.type] || typeColors.Event} flex-shrink-0`}>
          {event.type}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(event.startDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      {event.description && (
        <p className="text-xs text-gray-500 mt-1 truncate">{event.description}</p>
      )}
    </motion.div>
  );
};

export default CalendarCard;
