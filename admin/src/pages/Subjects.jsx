import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaBookOpen } from 'react-icons/fa';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

const EDUCATION_TYPES = ['Intermediate', 'Degree', 'B.Tech'];

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', educationType: '', group: '', color: '#7c3aed' });

  const load = async () => {
    try { const sData = await adminApi.getSubjects(); setSubjects(sData.subjects); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (form.educationType) {
      adminApi.getGroups(form.educationType).then((d) => setGroups(d.groups)).catch(() => {});
    } else {
      setGroups([]);
    }
  }, [form.educationType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSubject) { await adminApi.updateSubject(editSubject._id, form); toast.success('Subject updated'); }
      else { await adminApi.createSubject(form); toast.success('Subject created'); }
      setShowModal(false); setEditSubject(null); setForm({ name: '', description: '', educationType: '', group: '', color: '#7c3aed' }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try { await adminApi.deleteSubject(id); toast.success('Subject deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Subjects</h1><p className="text-gray-400 mt-1">Manage subjects per group</p></div>
        <button onClick={() => { setEditSubject(null); setForm({ name: '', description: '', educationType: '', group: '', color: '#7c3aed' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-accent text-white transition-all"><FaPlus /> Add Subject</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <motion.div key={subject._id} whileHover={{ y: -2 }} className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${subject.color}33`, color: subject.color }}><FaBookOpen size={20} /></div>
              <div className="flex-1"><h3 className="text-white font-semibold text-lg">{subject.name}</h3><p className="text-gray-500 text-xs">{subject.group?.name || 'No group'}</p>{subject.description && <p className="text-gray-400 text-sm mt-1">{subject.description}</p>}</div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button onClick={() => { setEditSubject(subject); setForm({ name: subject.name, description: subject.description || '', educationType: subject.group?.educationType || '', group: subject.group?._id || '', color: subject.color || '#7c3aed' }); if (subject.group?.educationType) adminApi.getGroups(subject.group.educationType).then((d) => setGroups(d.groups)).catch(() => {}); setShowModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all text-sm"><FaEdit /> Edit</button>
              <button onClick={() => handleDelete(subject._id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger transition-all text-sm"><FaTrash /> Delete</button>
            </div>
          </motion.div>
        ))}
      </div>
      {subjects.length === 0 && <div className="text-center py-16 text-gray-500"><FaBookOpen className="text-5xl text-gray-600 mx-auto mb-4" /><p>No subjects yet.</p></div>}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">{editSubject ? 'Edit Subject' : 'Add Subject'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-300 mb-2">Subject Name</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required /></div>
              <div><label className="block text-sm text-gray-300 mb-2">Education Type</label><select value={form.educationType} onChange={(e) => setForm({...form, educationType: e.target.value, group: ''})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required>
                <option value="">Select education type</option>{EDUCATION_TYPES.map((et) => <option key={et} value={et}>{et}</option>)}
              </select></div>
              <div><label className="block text-sm text-gray-300 mb-2">Group</label><select value={form.group} onChange={(e) => setForm({...form, group: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required disabled={!form.educationType}>
                <option value="">Select group</option>{groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select></div>
              <div><label className="block text-sm text-gray-300 mb-2">Color</label><input type="color" value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} className="w-full h-10 rounded-xl bg-white/5 border border-white/10 cursor-pointer" /></div>
              <div><label className="block text-sm text-gray-300 mb-2">Description</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" rows={3} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-accent text-white transition-all">{editSubject ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Subjects;
