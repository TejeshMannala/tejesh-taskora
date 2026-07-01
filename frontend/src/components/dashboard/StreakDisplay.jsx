import { motion } from 'framer-motion';
import { FaFire } from 'react-icons/fa';

const StreakDisplay = ({ streak = 0, longestStreak = 0 }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="glass-card p-6 flex items-center gap-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10">
        <div className={`text-5xl ${streak > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
          <motion.div
            animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaFire />
          </motion.div>
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-bold text-white">{streak}</p>
        <p className="text-gray-400 text-sm">Day Streak</p>
        <p className="text-xs text-gray-500 mt-1">Best: {longestStreak} days</p>
      </div>
    </motion.div>
  );
};

export default StreakDisplay;
