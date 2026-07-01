import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaBook, FaLayerGroup, FaBookOpen, FaTasks, FaCheckCircle, FaClock, FaUserPlus, FaSeedling } from 'react-icons/fa';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getDashboard();
        setStats(data.stats);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>;

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <FaUsers />, color: 'from-primary to-accent' },
    { label: 'Active Today', value: stats?.activeUsers || 0, icon: <FaUserPlus />, color: 'from-success to-green-600' },
    { label: 'Courses', value: stats?.totalCourses || 0, icon: <FaBook />, color: 'from-secondary to-cyan-600' },
    { label: 'Groups', value: stats?.totalGroups || 0, icon: <FaLayerGroup />, color: 'from-yellow-500 to-orange-600' },
    { label: 'Subjects', value: stats?.totalSubjects || 0, icon: <FaBookOpen />, color: 'from-pink-500 to-rose-600' },
    { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: <FaTasks />, color: 'from-indigo-500 to-purple-600' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of Taskora platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <motion.div key={card.label} whileHover={{ y: -2 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">{card.label}</p>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white`}>{card.icon}</div>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Task Completion</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={`${stats?.completionRate || 0} ${100 - (stats?.completionRate || 0)}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">{stats?.completionRate || 0}%</span>
            </div>
            <div>
              <p className="text-green-400 flex items-center gap-2"><FaCheckCircle /> {stats?.completedTasks || 0} completed</p>
              <p className="text-gray-400 flex items-center gap-2"><FaClock /> {stats?.pendingTasks || 0} pending</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {['/courses','/groups','/subjects','/users'].map((path) => (
              <button key={path} onClick={() => window.location.href = path}
                className="w-full text-left px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all text-sm capitalize">
                Manage {path.slice(1)}
              </button>
            ))}
            <button onClick={async () => {
              try {
                const data = await adminApi.seedData();
                toast.success(data.message);
                window.location.reload();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Seed failed');
              }
            }}
              className="w-full text-left px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all text-sm flex items-center gap-2">
              <FaSeedling /> Seed Sample Data
            </button>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">System Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Admins</span><span className="text-white">{stats?.totalAdmins || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">New Today</span><span className="text-white">{stats?.newToday || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Active Users</span><span className="text-white">{stats?.activeUsers || 0}</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
