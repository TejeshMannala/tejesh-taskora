import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaBook, FaCheckCircle, FaClock, FaPlus, FaTasks, FaBell, FaFire,
  FaCalendarAlt, FaGraduationCap, FaChartLine, FaArrowRight,
  FaHourglassHalf, FaUserGraduate, FaQuoteLeft, FaExclamationTriangle, FaSync, FaSpinner,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { taskApi } from '../../services/taskApi';
import { subjectApi } from '../../services/subjectApi';
import { notificationApi } from '../../services/notificationApi';
import { analyticsApi } from '../../services/analyticsApi';
import { alarmApi } from '../../services/alarmApi';
import { scheduleApi } from '../../services/scheduleApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
};

const quoteVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { delay: 0.6, type: 'spring', stiffness: 100 } },
};

const todayKey = new Date().toISOString().split('T')[0];

const greetings = [
  'Good morning', 'Good afternoon', 'Good evening',
];
const motivationalQuotes = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return greetings[0];
  if (hour < 17) return greetings[1];
  return greetings[2];
};

const getTodayQuote = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
};

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

const SkeletonCard = () => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
    <div className="h-10 w-10 rounded-xl bg-white/10 mb-4" />
    <div className="h-8 bg-white/10 rounded w-16 mb-2" />
    <div className="h-3 bg-white/10 rounded w-24" />
  </div>
);

const DashboardSkeleton = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-gray-900/60 to-gray-900/40 p-8 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-24 mb-3" />
      <div className="h-10 bg-white/10 rounded w-72 mb-3" />
      <div className="h-4 bg-white/10 rounded w-48 mb-4" />
      <div className="h-2 bg-white/10 rounded w-full max-w-md mb-6" />
      <div className="flex gap-3">
        <div className="h-11 w-32 rounded-xl bg-white/10" />
        <div className="h-11 w-32 rounded-xl bg-white/10" />
      </div>
    </div>
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-32 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/10 rounded-xl mb-3" />
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-36 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/10 rounded-xl mb-3" />
        ))}
      </div>
    </div>
  </motion.div>
);

const ErrorDisplay = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
  >
    <div className="rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 p-10 max-w-md">
      <FaExclamationTriangle size={48} className="mx-auto mb-4 text-rose-400" />
      <h2 className="text-xl font-bold text-white mb-2">Dashboard unavailable</h2>
      <p className="text-gray-400 mb-6">{message || 'Failed to load dashboard data.'}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
      >
        <FaSync /> Retry
      </button>
    </div>
  </motion.div>
);

const EmptyDashboard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
  >
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
        <FaBook className="text-primary" size={28} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Welcome to Taskora!</h3>
      <p className="text-gray-400 text-sm mb-6">
        Get started by adding your first task or subject.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <FaPlus /> Add Task
        </Link>
        <Link
          to="/subjects"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
        >
          <FaBook /> Add Subject
        </Link>
      </div>
    </div>
  </motion.div>
);

const AnimatedCounter = ({ value, suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    const duration = 800;
    const step = Math.max(1, Math.floor(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
};

const DashboardCard = ({ icon, label, value, suffix, color, iconColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 100, damping: 15 }}
    whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}
    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${color} backdrop-blur-md p-5 group cursor-default`}
  >
    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
    <div className="relative z-10">
      <div className={`text-xl mb-3 ${iconColor}`}>{icon}</div>
      <p className="text-2xl font-bold text-white">
        <AnimatedCounter value={value} suffix={suffix || ''} />
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  </motion.div>
);

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const greeting = useMemo(getGreeting, []);
  const quote = useMemo(getTodayQuote, []);
  const formattedDate = useMemo(formatDate, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskData, subjectData, notificationData] = await Promise.all([
        taskApi.getAll({ limit: 10 }).catch(() => ({ tasks: [] })),
        subjectApi.getAll().catch(() => ({ subjects: [] })),
        notificationApi.getAll({ limit: 5 }).catch(() => ({ notifications: [] })),
      ]);
      setTasks(taskData.tasks || []);
      setSubjects(subjectData.subjects || []);
      setNotifications(notificationData.notifications || []);

      try {
        const [analyticsData, alarmData, scheduleData] = await Promise.all([
          analyticsApi.getDashboard().catch(() => ({ stats: null })),
          alarmApi.getActive().catch(() => ({ alarms: [] })),
          scheduleApi.getToday().catch(() => ({ schedules: [], tasks: [] })),
        ]);
        setStats(analyticsData.stats);
        setActiveAlarms(alarmData.alarms || []);
        setTodaySchedule(scheduleData.schedules || []);
      } catch {
        // non-critical
      }
    } catch (err) {
      const msg = err?.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : err?.code === 'ERR_NETWORK'
          ? 'Unable to reach the server. Check your connection.'
          : 'Failed to load dashboard data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.date?.slice(0, 10) === todayKey),
    [tasks],
  );

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'Completed'),
    [tasks],
  );

  const completedCount = tasks.filter((task) => task.status === 'Completed').length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const upcomingTasks = useMemo(
    () => tasks
      .filter((task) => task.dueDate && task.status !== 'Completed')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5),
    [tasks],
  );

  const quickActions = [
    { label: 'Add Subject', icon: <FaBook />, path: '/subjects', color: 'from-purple-500 to-purple-600' },
    { label: 'Create Task', icon: <FaTasks />, path: '/tasks', color: 'from-cyan-500 to-cyan-600' },
    { label: 'Set Alarm', icon: <FaBell />, path: '/reminders', color: 'from-rose-500 to-rose-600' },
    { label: 'View Calendar', icon: <FaCalendarAlt />, path: '/calendar', color: 'from-amber-500 to-amber-600' },
  ];

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorDisplay message={error} onRetry={loadAllData} />;
  if (!tasks.length && !subjects.length && !user?.educationType) return <EmptyDashboard />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-gray-900/70 to-cyan-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.3),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.2),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-secondary tracking-wide"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse" />
                {formattedDate}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                className="mt-2 text-4xl font-bold text-white md:text-5xl lg:text-6xl"
              >
                {greeting}, {user?.name?.split(' ')[0] || 'student'}.
              </motion.h1>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3"
            >
              <FaClock className="text-secondary" size={20} />
              <span className="text-2xl font-bold text-white tabular-nums">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-1 max-w-2xl text-gray-300 text-lg"
          >
            {tasks.length > 0
              ? `You have ${pendingTasks.length} pending task${pendingTasks.length !== 1 ? 's' : ''} and ${subjects.length} subject${subjects.length !== 1 ? 's' : ''} to study.`
              : subjects.length > 0
                ? `You have ${subjects.length} subject${subjects.length !== 1 ? 's' : ''} to study. Start adding tasks!`
                : 'Start your journey by adding tasks and subjects.'}
          </motion.p>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 max-w-md"
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Daily Progress</span>
              <span className="text-white font-semibold">{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              />
            </div>
          </motion.div>

          {/* Quote */}
          <motion.div
            variants={quoteVariants}
            className="mt-6 flex items-start gap-3 max-w-lg"
          >
            <FaQuoteLeft className="text-primary/60 mt-1 shrink-0" size={14} />
            <p className="text-sm text-gray-400 italic">
              &ldquo;{quote.text}&rdquo;
              <span className="block text-xs text-gray-600 mt-0.5">&mdash; {quote.author}</span>
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Link
              to="/tasks"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <FaPlus size={12} />
              New Task
              <FaArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm px-5 py-3 font-medium text-white hover:bg-white/20 transition-all duration-300"
            >
              <FaUserGraduate />
              My Profile
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Dashboard Cards */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
      >
        <DashboardCard
          icon={<FaBook />}
          label="Total Subjects"
          value={subjects.length}
          color="from-purple-500/20 to-purple-600/5"
          iconColor="text-purple-400"
          delay={0}
        />
        <DashboardCard
          icon={<FaTasks />}
          label="Pending Tasks"
          value={pendingTasks.length}
          color="from-cyan-500/20 to-cyan-600/5"
          iconColor="text-cyan-400"
          delay={0.05}
        />
        <DashboardCard
          icon={<FaCheckCircle />}
          label="Completed"
          value={completedCount}
          color="from-green-500/20 to-green-600/5"
          iconColor="text-green-400"
          delay={0.1}
        />
        <DashboardCard
          icon={<FaHourglassHalf />}
          label="Active Alarms"
          value={activeAlarms.length}
          color="from-rose-500/20 to-rose-600/5"
          iconColor="text-rose-400"
          delay={0.15}
        />
        <DashboardCard
          icon={<FaFire />}
          label="Study Streak"
          value={user?.studyStreak || 0}
          suffix="d"
          color="from-orange-500/20 to-orange-600/5"
          iconColor="text-orange-400"
          delay={0.2}
        />
        <DashboardCard
          icon={<FaGraduationCap />}
          label="Upcoming Exams"
          value={upcomingTasks.length}
          color="from-amber-500/20 to-amber-600/5"
          iconColor="text-amber-400"
          delay={0.25}
        />
      </motion.div>

      {/* Daily Program */}
      {todaySchedule.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaClock className="text-secondary" size={16} />
            Daily Program
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todaySchedule.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {item.type?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title || item.type}</p>
                    {item.date && (
                      <p className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                {item.tasks?.length > 0 && (
                  <div className="space-y-1 mt-2 pl-10">
                    {item.tasks.slice(0, 3).map((task) => (
                      <p key={task._id} className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-500" />
                        {task.title}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.path}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-5 text-white cursor-pointer group`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-6 -mt-6" />
                <div className="relative z-10">
                  <div className="text-2xl mb-2 opacity-80">{action.icon}</div>
                  <p className="font-semibold text-sm">{action.label}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Activity Section */}
      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"
      >
        {/* Today's Tasks */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FaTasks className="text-primary" size={16} />
              Today&apos;s Tasks
            </h2>
            <Link
              to="/tasks"
              className="text-sm text-secondary hover:text-accent transition-colors flex items-center gap-1"
            >
              View all <FaArrowRight size={10} />
            </Link>
          </div>
          <div className="space-y-3">
            {todayTasks.length > 0 ? (
              todayTasks.slice(0, 5).map((task, i) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === 'High' ? 'bg-rose-400' :
                      task.priority === 'Medium' ? 'bg-amber-400' :
                      'bg-green-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.subject || 'General'}
                        {task.dueTime ? ` · ${task.dueTime}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    task.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                    task.status === 'In Progress' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {task.status}
                  </span>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <FaTasks className="mx-auto text-gray-600 mb-3" size={28} />
                <p className="text-gray-500 text-sm">No tasks scheduled for today.</p>
                <Link to="/tasks" className="inline-flex items-center gap-1 mt-3 text-sm text-secondary hover:text-accent transition-colors">
                  <FaPlus size={10} /> Create a task
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Right column: Notifications + Upcoming */}
        <div className="space-y-6">
          {/* Upcoming Reminders */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaClock className="text-secondary" size={16} />
                Upcoming
              </h2>
              <Link to="/reminders" className="text-sm text-secondary hover:text-accent transition-colors">
                View
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task, i) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-white text-sm truncate">{task.title}</p>
                      <FaBell className="shrink-0 text-gray-600" size={12} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }) : 'No date set'}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6">
                  <FaClock className="mx-auto text-gray-600 mb-2" size={24} />
                  <p className="text-gray-500 text-sm">No upcoming reminders.</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Notifications */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaBell className="text-amber-400" size={16} />
                Notifications
              </h2>
              <Link to="/notifications" className="text-sm text-secondary hover:text-accent transition-colors">
                View
              </Link>
            </div>
            <div className="space-y-2">
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((item, i) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-all"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'achievement' ? 'bg-amber-500/20 text-amber-400' :
                      item.type === 'reminder' ? 'bg-cyan-500/20 text-cyan-400' :
                      item.type === 'exam' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-primary/20 text-primary'
                    }`}>
                      <FaBell size={10} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title || 'Notification'}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.message}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No notifications yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>

      {/* Academic Profile Footer */}
      {user?.educationType && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5"
        >
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <FaGraduationCap className="text-primary" />
              <span>{user.educationType}</span>
            </div>
            {user?.group?.name && (
              <>
                <span className="text-gray-700">|</span>
                <span className="text-gray-400">{user.group.name}</span>
              </>
            )}
            {stats && (
              <>
                <span className="text-gray-700">|</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <FaChartLine className="text-secondary" size={12} />
                  {stats.completionRate || 0}% completion rate
                </span>
                <span className="text-gray-700">|</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <FaFire className="text-orange-400" size={12} />
                  {stats.totalStudyHours || 0}h studied
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Home;
