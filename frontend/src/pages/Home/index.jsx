import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBell, FaBook, FaCheckCircle, FaClock, FaPlus, FaTasks, FaUserGraduate, FaSearch, FaGraduationCap } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { taskApi } from '../../services/taskApi';
import { subjectApi } from '../../services/subjectApi';
import { notificationApi } from '../../services/notificationApi';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import BackButton from '../../components/ui/BackButton';

const todayKey = new Date().toISOString().split('T')[0];

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectSearch, setSubjectSearch] = useState('');

  useEffect(() => {
    const loadHome = async () => {
      try {
        const [taskData, subjectData, notificationData] = await Promise.all([
          taskApi.getAll({ limit: 8 }),
          subjectApi.getAll(),
          notificationApi.getAll({ limit: 5 }),
        ]);
        setTasks(taskData.tasks || []);
        setSubjects(subjectData.subjects || []);
        setNotifications(notificationData.notifications || []);
      } catch {
        toast.error('Failed to load home');
      } finally {
        setLoading(false);
      }
    };
    loadHome();
  }, []);

  const todayTasks = useMemo(() => tasks.filter((task) => task.date?.slice(0, 10) === todayKey), [tasks]);
  const reminders = useMemo(
    () => tasks
      .filter((task) => task.dueDate && task.status !== 'Completed')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4),
    [tasks]
  );
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const filteredSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    return query ? subjects.filter((s) => s.name.toLowerCase().includes(query)) : subjects;
  }, [subjects, subjectSearch]);

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <BackButton to="/dashboard" />
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.22),transparent_34%),linear-gradient(135deg,rgba(124,58,237,0.18),rgba(18,18,26,0.92))] p-6 md:p-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-10 max-w-3xl">
          <p className="text-sm font-medium text-secondary">Student Home</p>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-5xl">Welcome back, {user?.name || 'student'}.</h1>
          <p className="mt-4 max-w-2xl text-gray-300">Plan your study day, track tasks, and keep reminders close without any admin clutter.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/tasks" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 font-semibold text-gray-950">
              <FaPlus /> New Task
            </Link>
            <Link to="/profile" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white">
              <FaUserGraduate /> Profile
            </Link>
          </div>
        </motion.div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<FaTasks />} label="Today's Tasks" value={todayTasks.length} />
        <Metric icon={<FaBook />} label="Subjects" value={subjects.length} />
        <Metric icon={<FaClock />} label="Reminders" value={reminders.length} />
        <Metric icon={<FaCheckCircle />} label="Progress" value={`${progress}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel title="Today's Tasks" action={<Link to="/tasks" className="text-sm text-secondary">View all</Link>}>
          {todayTasks.length ? todayTasks.slice(0, 5).map((task) => <TaskRow key={task._id} task={task} />) : <Empty text="No tasks scheduled for today." />}
        </Panel>

        <Panel title="Upcoming Reminders" action={<Link to="/reminders" className="text-sm text-secondary">Open</Link>}>
          {reminders.length ? reminders.map((task) => <ReminderRow key={task._id} task={task} />) : <Empty text="No active reminders." />}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Subject Overview" action={<Link to="/subjects" className="text-sm text-secondary">Manage</Link>}>
          {user?.group ? (
            <>
              <div className="relative mb-3">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              {filteredSubjects.length ? filteredSubjects.slice(0, 6).map((subject) => (
                <div key={subject._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color || '#7c3aed' }} />
                  <span className="truncate text-white">{subject.name}</span>
                </div>
              )) : <Empty text={subjectSearch ? 'No subjects match your search.' : 'No subjects found. Complete your profile to generate subjects.'} />}
            </>
          ) : (
            <Empty text="Complete your academic profile to generate subjects." />
          )}
        </Panel>

        <Panel title="Recent Notifications" action={<Link to="/notifications" className="text-sm text-secondary">View</Link>}>
          {notifications.length ? notifications.slice(0, 5).map((item) => (
            <div key={item._id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <FaBell className="mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium text-white">{item.title || 'Notification'}</p>
                <p className="text-xs text-gray-400">{item.message}</p>
              </div>
            </div>
          )) : <Empty text="You are all caught up." />}
        </Panel>
      </div>

      {user?.educationType && user?.group && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FaGraduationCap />
            <span>Academic Profile: {user.educationType} / {user.group?.name || 'Selected Group'} / {user.academicYear || 'Year not set'}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Metric = ({ icon, label, value }) => (
  <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
    <div className="mb-4 text-xl text-secondary">{icon}</div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
  </motion.div>
);

const Panel = ({ title, action, children }) => (
  <section className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {action}
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const TaskRow = ({ task }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
    <div className="min-w-0">
      <p className="truncate font-medium text-white">{task.title}</p>
      <p className="text-xs text-gray-400">{task.subject || 'General'} / {task.priority}</p>
    </div>
    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-gray-300">{task.status}</span>
  </div>
);

const ReminderRow = ({ task }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
    <p className="font-medium text-white">{task.title}</p>
    <p className="mt-1 text-xs text-gray-400">{new Date(task.dueDate).toLocaleString()}</p>
  </div>
);

const Empty = ({ text }) => <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">{text}</p>;

export default Home;
