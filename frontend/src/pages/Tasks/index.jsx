import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import TaskCard from '../../components/common/TaskCard';
import Modal from '../../components/ui/Modal';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import { fetchTasks, createTask, updateTask, deleteTask, toggleTask } from '../../redux/slices/taskSlice';
import BackButton from '../../components/ui/BackButton';

const Tasks = () => {
  const dispatch = useDispatch();
  const { tasks, isLoading, stats } = useSelector((state) => state.tasks);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [form, setForm] = useState({ title: '', subject: '', durationMinutes: 30, priority: 'Medium', date: new Date().toISOString().split('T')[0], dueDate: '', reminderInterval: 5, notes: '' });

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await dispatch(updateTask({ id: editing._id, data: form })).unwrap();
        toast.success('Task updated');
      } else {
        await dispatch(createTask(form)).unwrap();
        toast.success('Task created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ title: '', subject: '', durationMinutes: 30, priority: 'Medium', date: new Date().toISOString().split('T')[0], dueDate: '', reminderInterval: 5, notes: '' });
    } catch (err) {
      toast.error(err || 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditing(task);
    setForm({ title: task.title, subject: task.subject || '', durationMinutes: task.durationMinutes, priority: task.priority, date: new Date(task.date).toISOString().split('T')[0], dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '', reminderInterval: task.reminderInterval || 5, notes: task.notes || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this task?')) {
      try {
        await dispatch(deleteTask(id)).unwrap();
        toast.success('Task deleted');
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await dispatch(toggleTask(id)).unwrap();
    } catch {
      toast.error('Failed to toggle');
    }
  };

  if (isLoading && !tasks.length) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">
            {stats?.completed || 0} completed · {stats?.total || tasks.length} total
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setEditing(null); setForm({ title: '', subject: '', durationMinutes: 30, priority: 'Medium', date: new Date().toISOString().split('T')[0], dueDate: '', reminderInterval: 5, notes: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-accent text-white font-medium transition-all shadow-lg shadow-primary/30"
        >
          <FaPlus /> New Task
        </motion.button>
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          className="min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </Select>
        <Select
          value={filters.priority}
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="min-w-[140px]"
        >
          <option value="">All Priority</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </Select>
      </div>

      <AnimatePresence mode="popLayout">
        {tasks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-500 text-lg">No tasks found</p>
            <p className="text-gray-600 text-sm mt-2">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </AnimatePresence>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Study Mathematics" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Mathematics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (min)</label>
              <input type="number" required min={1} value={form.durationMinutes} onChange={(e) => setForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <Select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date & Time (for alarm)</label>
              <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Remind Again Every</label>
              <Select value={form.reminderInterval} onChange={(e) => setForm(f => ({ ...f, reminderInterval: parseInt(e.target.value) }))}>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={25}>25 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-primary hover:bg-accent text-white font-medium transition-all">
            {editing ? 'Update Task' : 'Create Task'}
          </button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Tasks;
