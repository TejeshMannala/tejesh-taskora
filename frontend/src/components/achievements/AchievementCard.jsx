import { motion } from 'framer-motion';

const AchievementCard = ({ achievement, unlocked }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`glass-card p-5 text-center transition-all ${
        unlocked ? 'opacity-100' : 'opacity-40 grayscale'
      }`}
    >
      <div className={`text-4xl mb-3 ${unlocked ? 'animate-bounce' : ''}`}>
        {achievement.icon || '🏆'}
      </div>
      <h3 className="font-bold text-white text-sm mb-1">{achievement.name}</h3>
      <p className="text-xs text-gray-400">{achievement.description}</p>
      <div className="mt-3 inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
        +{achievement.xpReward} XP
      </div>
      {unlocked && (
        <div className="mt-2 text-xs text-success">✓ Unlocked</div>
      )}
    </motion.div>
  );
};

export default AchievementCard;
