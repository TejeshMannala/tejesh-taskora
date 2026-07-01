import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';
import CalendarCard from '../../components/calendar/CalendarCard';
import Modal from '../../components/ui/Modal';
import { calendarApi } from '../../services/calendarApi';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import BackButton from '../../components/ui/BackButton';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Event', startDate: '', endDate: '', description: '', color: '#7c3aed' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  useEffect(() => {
    loadEvents();
  }, [year, month]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59).toISOString();
      const data = await calendarApi.getConsolidated({ start, end });
      setEvents([...(data.events || []), ...(data.tasks || []).map(t => ({ ...t, _id: `task-${t._id}`, startDate: t.date, type: 'Task', color: '#22c55e' }))]);
    } catch {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await calendarApi.create({ ...form, startDate: new Date(form.startDate).toISOString(), endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined });
      toast.success('Event created');
      setShowModal(false);
      loadEvents();
    } catch {
      toast.error('Failed to create event');
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const getEventsForDay = (day) => events.filter(e => {
    const d = new Date(e.startDate);
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
  });

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 glass rounded-xl text-gray-400 hover:text-white"><FaChevronLeft /></button>
          <h1 className="text-2xl font-bold text-white">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h1>
          <button onClick={nextMonth} className="p-2 glass rounded-xl text-gray-400 hover:text-white"><FaChevronRight /></button>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white">
          <FaPlus /> Event
        </motion.button>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-24 rounded-xl bg-white/[0.02]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={day} className={`min-h-24 rounded-xl p-2 ${isToday ? 'bg-primary/20 border border-primary/50' : 'bg-white/[0.03] hover:bg-white/[0.06]'} transition-all`}>
                <span className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-gray-400'}`}>{day}</span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div key={event._id} className="text-xs px-1.5 py-0.5 rounded truncate text-white" style={{ backgroundColor: event.color || '#7c3aed' }}>
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 6).map(event => (
              <CalendarCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Event">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Math Exam" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <Select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
              <option>Exam</option>
              <option>Task</option>
              <option>Event</option>
              <option>Reminder</option>
              <option>Deadline</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input type="datetime-local" required value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-accent transition-all">Create Event</button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Calendar;
