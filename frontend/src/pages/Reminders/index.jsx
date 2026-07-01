import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaCheck, FaClock, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { taskApi } from '../../services/taskApi';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import BackButton from '../../components/ui/BackButton';

const Reminders = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadReminders = async () => {
    try {
      const data = await taskApi.getAll({ limit: 100 });
      setTasks(data.tasks || []);
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const reminders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks
      .filter((task) => task.dueDate && task.status !== 'Completed')
      .filter((task) => !query || task.title.toLowerCase().includes(query) || task.subject?.toLowerCase().includes(query))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [tasks, search]);

  const markDone = async (task) => {
    try {
      await taskApi.toggle(task._id);
      toast.success('Reminder stopped');
      loadReminders();
    } catch {
      toast.error('Failed to complete task');
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reminders</h1>
          <p className="mt-1 text-sm text-gray-400">Active task alarms continue until the task is completed.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search reminders..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none transition focus:border-primary"
        />
      </div>

      {reminders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <FaBell size={42} className="mx-auto mb-4 text-gray-600" />
          <p className="text-lg text-gray-400">No active reminders</p>
          <p className="mt-2 text-sm text-gray-600">Add a due date to a task to schedule one.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reminders.map((task, index) => (
            <motion.article
              key={task._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-white">{task.title}</p>
                  <p className="mt-1 text-sm text-gray-400">{task.subject || 'General'}</p>
                </div>
                <FaClock className="text-secondary" />
              </div>
              <p className="mt-4 text-sm text-gray-300">{new Date(task.dueDate).toLocaleString()}</p>
              <button
                onClick={() => markDone(task)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white"
              >
                <FaCheck /> Mark Completed
              </button>
            </motion.article>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Reminders;
