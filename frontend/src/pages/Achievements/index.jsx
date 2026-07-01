import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaSync } from 'react-icons/fa';
import AchievementCard from '../../components/achievements/AchievementCard';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import { achievementApi } from '../../services/achievementApi';
import BackButton from '../../components/ui/BackButton';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementApi.getAll();
      await achievementApi.check();
      setAchievements(data.achievements || []);
      setUnlockedCount(data.unlockedCount || 0);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAchievements(); }, []);

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Achievements</h1>
          <p className="text-gray-400 mt-1">{unlockedCount} / {totalCount} unlocked</p>
        </div>
        <button onClick={loadAchievements} className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-gray-300 hover:text-white transition-all">
          <FaSync /> Refresh
        </button>
      </div>

      {totalCount > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-gray-400">{Math.round((unlockedCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement._id} achievement={achievement} unlocked={achievement.unlocked} />
        ))}
      </div>

      {achievements.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FaTrophy size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No achievements found. Seed them first!</p>
        </div>
      )}
    </motion.div>
  );
};

export default Achievements;
