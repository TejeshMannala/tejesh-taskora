import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaCalendarDay, FaCalendarWeek } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ScheduleCard from '../../components/common/ScheduleCard';
import Modal from '../../components/ui/Modal';
import { scheduleApi } from '../../services/scheduleApi';
import BackButton from '../../components/ui/BackButton';

const Planner = () => {
  const [view, setView] = useState('today');
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', duration: 30, date: new Date().toISOString().split('T')[0], time: '09:00' });

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = view === 'today' ? await scheduleApi.getToday() : await scheduleApi.getWeekly();
      setSchedules(data.schedules || []);
      setTasks(data.tasks || []);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const dateTime = new Date(`${form.date}T${form.time}`);
      await scheduleApi.create({ type: view === 'today' ? 'Daily' : 'Weekly', date: dateTime, tasks: [] });
      toast.success('Schedule added');
      setShowModal(false);
      loadData();
    } catch {
      toast.error('Failed to create schedule');
    }
  };

  const handleDelete = async (id) => {
    try {
      await scheduleApi.delete(id);
      toast.success('Schedule removed');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const allItems = [...schedules, ...tasks.map(t => ({ ...t, _id: `task-${t._id}`, subject: t.subject, duration: t.durationMinutes, status: t.status }))];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">My Schedule</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('today')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${view === 'today' ? 'bg-primary text-white' : 'glass text-gray-400'}`}>
            <FaCalendarDay /> Today
          </button>
          <button onClick={() => setView('weekly')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${view === 'weekly' ? 'bg-primary text-white' : 'glass text-gray-400'}`}>
            <FaCalendarWeek /> Weekly
          </button>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white">
            <FaPlus /> Add
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass-card p-4 animate-pulse"><div className="h-6 bg-white/10 rounded w-1/3" /></div>)}
        </div>
      ) : allItems.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-500">No schedule for {view === 'today' ? 'today' : 'this week'}</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {allItems.map((item) => (
              <ScheduleCard key={item._id} schedule={item} onDelete={handleDelete} />
            ))}
          </div>
        </AnimatePresence>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add to Schedule">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
            <input type="text" required value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="English" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (min)</label>
              <input type="number" required min={5} value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
              <input type="time" required value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-primary hover:bg-accent text-white font-medium transition-all">Add to Schedule</button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Planner;
