import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaCalendarCheck, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { calendarApi } from '../../services/calendarApi';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import BackButton from '../../components/ui/BackButton';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '' });

  useEffect(() => { loadExams(); }, []);

  const loadExams = async () => {
    try {
      const data = await calendarApi.getAll({ type: 'Exam' });
      setExams(data.events || []);
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await calendarApi.create({
        ...form,
        type: 'Exam',
        color: '#ef4444',
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      });
      toast.success('Exam added');
      setShowModal(false);
      loadExams();
    } catch {
      toast.error('Failed to add exam');
    }
  };

  const handleDelete = async (id) => {
    try {
      await calendarApi.delete(id);
      toast.success('Exam removed');
      loadExams();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Exam Planner</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white"><FaPlus /> Add Exam</button>
      </div>

      {exams.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FaCalendarCheck size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No exams scheduled. Add your upcoming exams!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map((exam) => {
            const daysUntil = Math.ceil((new Date(exam.startDate) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <motion.div key={exam._id} whileHover={{ scale: 1.02 }} className="glass-card p-6 border-l-4 border-l-danger relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-white text-lg">{exam.title}</h3>
                    <button onClick={() => handleDelete(exam._id)} className="text-gray-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-sm">Delete</button>
                  </div>
                  {exam.description && <p className="text-gray-400 text-sm mt-2">{exam.description}</p>}
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <FaCalendarCheck className="text-danger" />
                    <span className="text-gray-300">{new Date(exam.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <FaExclamationTriangle className={daysUntil <= 7 ? 'text-yellow-500' : 'text-gray-500'} />
                    <span className={daysUntil <= 7 ? 'text-yellow-500 font-medium' : 'text-gray-400'}>
                      {daysUntil <= 0 ? 'Today!' : `${daysUntil} days away`}
                    </span>
                  </div>
                  {daysUntil > 0 && daysUntil <= 30 && (
                    <div className="mt-3 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, 100 - (daysUntil / 30) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-danger to-yellow-500 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Exam">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Exam Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Mathematics Final" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" />
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
          <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-accent transition-all">Add Exam</button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Exams;
