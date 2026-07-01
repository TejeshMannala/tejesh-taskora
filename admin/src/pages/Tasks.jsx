import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaSearch, FaTasks, FaCheckCircle, FaClock } from 'react-icons/fa';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async (p = page, s = search, st = statusFilter) => {
    setLoading(true);
    try { const params = { page: p, limit: 20 }; if (s) params.search = s; if (st) params.status = st; const data = await adminApi.getTasks(params); setTasks(data.tasks); setPages(data.pages); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1, search, statusFilter); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await adminApi.deleteTask(id); toast.success('Task deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div><h1 className="text-3xl font-bold text-white">Tasks</h1><p className="text-gray-400 mt-1">View all user tasks</p></div>
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary" /></div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white">Search</button>
        </form>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary">
          <option value="">All Status</option><option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
        </select>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/10"><th className="text-left p-4 text-gray-400 text-sm font-medium">Title</th><th className="text-left p-4 text-gray-400 text-sm font-medium">User</th><th className="text-left p-4 text-gray-400 text-sm font-medium">Status</th><th className="text-left p-4 text-gray-400 text-sm font-medium">Priority</th><th className="text-left p-4 text-gray-400 text-sm font-medium">Due</th><th className="text-right p-4 text-gray-400 text-sm font-medium">Actions</th></tr></thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4"><span className="text-white text-sm">{task.title}</span></td>
                  <td className="p-4 text-gray-400 text-sm">{task.user?.name || 'Unknown'}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${task.status === 'Completed' ? 'bg-success/20 text-success' : task.status === 'In Progress' ? 'bg-secondary/20 text-secondary' : 'bg-yellow-500/20 text-yellow-400'}`}>{task.status === 'Completed' ? <FaCheckCircle className="inline mr-1" /> : task.status === 'In Progress' ? <FaClock className="inline mr-1" /> : null}{task.status}</span></td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${task.priority === 'High' ? 'bg-danger/20 text-danger' : task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{task.priority}</span></td>
                  <td className="p-4 text-gray-500 text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="p-4 text-right"><button onClick={() => handleDelete(task._id)} className="p-2 rounded-lg hover:bg-danger/10 text-gray-400 hover:text-danger transition-all"><FaTrash /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && <div className="text-center py-12"><FaTasks className="text-4xl text-gray-600 mx-auto mb-3" /><p className="text-gray-500">No tasks found.</p></div>}
      </div>
      {pages > 1 && <div className="flex justify-center gap-2">{Array.from({ length: pages }, (_, i) => (<button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{i + 1}</button>))}</div>}
    </motion.div>
  );
};

export default AdminTasks;
