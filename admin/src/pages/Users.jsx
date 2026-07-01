import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaEdit, FaSearch, FaUsers, FaUserShield } from 'react-icons/fa';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showEdit, setShowEdit] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'student' });

  const load = async (p = page, s = search) => {
    setLoading(true);
    try { const data = await adminApi.getUsers({ page: p, search: s, limit: 20 }); setUsers(data.users); setPages(data.pages); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1, search); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await adminApi.deleteUser(id); toast.success('User deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); if (!showEdit) return;
    try { await adminApi.updateUser(showEdit._id, editForm); toast.success('User updated'); setShowEdit(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div><h1 className="text-3xl font-bold text-white">Users</h1><p className="text-gray-400 mt-1">Manage platform users</p></div>
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary" /></div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white">Search</button>
      </form>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Name</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Role</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Joined</th>
                <th className="text-right p-4 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">{user.name?.charAt(0) || 'U'}</div><span className="text-white text-sm">{user.name}</span></div></td>
                  <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${user.role === 'admin' ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>{user.role === 'admin' ? <FaUserShield className="inline mr-1" /> : <FaUsers className="inline mr-1" />}{user.role}</span></td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right"><div className="flex justify-end gap-2">
                    <button onClick={() => { setShowEdit(user); setEditForm({ name: user.name, email: user.email, role: user.role }); }} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"><FaEdit /></button>
                    <button onClick={() => handleDelete(user._id)} className="p-2 rounded-lg hover:bg-danger/10 text-gray-400 hover:text-danger transition-all"><FaTrash /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <div className="text-center py-12 text-gray-500">No users found.</div>}
      </div>
      {pages > 1 && <div className="flex justify-center gap-2">{Array.from({ length: pages }, (_, i) => (<button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{i + 1}</button>))}</div>}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowEdit(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">Edit User</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div><label className="block text-sm text-gray-300 mb-2">Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required /></div>
              <div><label className="block text-sm text-gray-300 mb-2">Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required /></div>
              <div><label className="block text-sm text-gray-300 mb-2">Role</label><select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"><option value="student">Student</option><option value="admin">Admin</option></select></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-accent text-white transition-all">Update</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminUsers;
