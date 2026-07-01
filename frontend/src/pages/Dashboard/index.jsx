import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTasks, FaClock, FaCheckCircle, FaBrain, FaFire, FaChartLine } from 'react-icons/fa';
import StatsCard from '../../components/analytics/StatsCard';
import RecentTasks from '../../components/dashboard/RecentTasks';
import StreakDisplay from '../../components/dashboard/StreakDisplay';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import { analyticsApi } from '../../services/analyticsApi';
import { taskApi } from '../../services/taskApi';
import { fetchTodaySchedule } from '../../redux/slices/scheduleSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTask } from '../../redux/slices/taskSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, tasksData] = await Promise.all([
          analyticsApi.getDashboard(),
          taskApi.getAll({ limit: 5 }),
        ]);
        setStats(statsData.stats);
        setRecentTasks(tasksData.tasks || []);
        dispatch(fetchTodaySchedule());
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  const handleToggle = async (id) => {
    try {
      await dispatch(toggleTask(id)).unwrap();
      const tasksData = await taskApi.getAll({ limit: 5 });
      setRecentTasks(tasksData.tasks || []);
    } catch {
      toast.error('Failed to toggle task');
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name}!</h1>
          <p className="text-gray-400 mt-1">Here's your study overview for today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Study Hours"
          value={`${stats?.totalStudyHours?.toFixed(1) || 0}h`}
          icon={<FaClock size={22} />}
          color="from-primary to-accent"
          subtitle={`${stats?.weeklyStudyHours?.toFixed(1) || 0}h this week`}
        />
        <StatsCard
          title="Tasks Completed"
          value={stats?.completedTasks || 0}
          icon={<FaCheckCircle size={22} />}
          color="from-success to-green-600"
          subtitle={`${stats?.completionRate || 0}% completion rate`}
          onClick={() => navigate('/tasks')}
        />
        <StatsCard
          title="Focus Score"
          value={`${stats?.avgFocusScore || 0}%`}
          icon={<FaBrain size={22} />}
          color="from-secondary to-cyan-600"
          subtitle={`${stats?.totalSessions || 0} sessions total`}
        />
        <StatsCard
          title="Today's Tasks"
          value={stats?.todayTasks || 0}
          icon={<FaTasks size={22} />}
          color="from-yellow-500 to-orange-600"
          subtitle={`${stats?.pendingTasks || 0} pending`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <button onClick={() => navigate('/tasks')} className="text-sm text-secondary hover:text-white transition-colors">
              View All
            </button>
          </div>
          <RecentTasks tasks={recentTasks} onToggle={handleToggle} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Streak</h2>
          </div>
          <StreakDisplay streak={user?.studyStreak || 0} longestStreak={user?.longestStreak || 0} />
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-6 mt-6 flex items-center gap-4 cursor-pointer"
            onClick={() => navigate('/analytics')}
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary text-white">
              <FaChartLine size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.completionRate || 0}%</p>
              <p className="text-gray-400 text-sm">Task Completion</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
