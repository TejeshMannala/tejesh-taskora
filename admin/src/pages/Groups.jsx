import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaLayerGroup } from 'react-icons/fa';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', course: '' });

  const load = async () => {
    try { const [gData, cData] = await Promise.all([adminApi.getGroups(), adminApi.getCourses()]); setGroups(gData.groups); setCourses(cData.courses); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editGroup) { await adminApi.updateGroup(editGroup._id, form); toast.success('Group updated'); }
      else { await adminApi.createGroup(form); toast.success('Group created'); }
      setShowModal(false); setEditGroup(null); setForm({ name: '', description: '', course: '' }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this group?')) return;
    try { await adminApi.deleteGroup(id); toast.success('Group deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Groups</h1><p className="text-gray-400 mt-1">Manage groups under courses</p></div>
        <button onClick={() => { setEditGroup(null); setForm({ name: '', description: '', course: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-accent text-white transition-all"><FaPlus /> Add Group</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <motion.div key={group._id} whileHover={{ y: -2 }} className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-secondary/20 text-secondary"><FaLayerGroup size={20} /></div>
              <div className="flex-1"><h3 className="text-white font-semibold text-lg">{group.name}</h3><p className="text-gray-500 text-xs">{group.course?.name || 'Unknown'}</p>{group.description && <p className="text-gray-400 text-sm mt-1">{group.description}</p>}</div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button onClick={() => { setEditGroup(group); setForm({ name: group.name, description: group.description || '', course: group.course?._id || '' }); setShowModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all text-sm"><FaEdit /> Edit</button>
              <button onClick={() => handleDelete(group._id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger transition-all text-sm"><FaTrash /> Delete</button>
            </div>
          </motion.div>
        ))}
      </div>
      {groups.length === 0 && <div className="text-center py-16 text-gray-500"><FaLayerGroup className="text-5xl text-gray-600 mx-auto mb-4" /><p>No groups yet.</p></div>}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">{editGroup ? 'Edit Group' : 'Add Group'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-300 mb-2">Group Name</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required /></div>
              <div><label className="block text-sm text-gray-300 mb-2">Course</label><select value={form.course} onChange={(e) => setForm({...form, course: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required>
                <option value="">Select course</option>{courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select></div>
              <div><label className="block text-sm text-gray-300 mb-2">Description</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" rows={3} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-accent text-white transition-all">{editGroup ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Groups;
