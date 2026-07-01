import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaKey, FaUserShield } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { adminApi } from '../services/adminApi';

const AdminSettings = () => {
  const [seedForm, setSeedForm] = useState({ name: '', email: '', password: '' });
  const [seeding, setSeeding] = useState(false);
  const [academicSeeding, setAcademicSeeding] = useState(false);

  const handleSeed = async (e) => {
    e.preventDefault();
    setSeeding(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/admin/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seedForm),
      });
      const data = await res.json();
      if (data.success) { toast.success('Admin created/promoted successfully'); setSeedForm({ name: '', email: '', password: '' }); }
      else { toast.error(data.message || 'Failed'); }
    } catch { toast.error('Failed to create admin'); }
    setSeeding(false);
  };

  const handleAcademicSeed = async () => {
    setAcademicSeeding(true);
    try {
      const data = await adminApi.seedData();
      toast.success(data.message || 'Academic data seeded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed academic data');
    } finally {
      setAcademicSeeding(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div><h1 className="text-3xl font-bold text-white">Settings</h1><p className="text-gray-400 mt-1">Admin configuration</p></div>
      <div className="glass-card max-w-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/20 text-primary"><FaBook size={24} /></div>
          <div><h2 className="text-xl font-bold text-white">Academic Data</h2><p className="text-gray-400 text-sm">Add missing B.Tech, Degree, groups, and subjects</p></div>
        </div>
        <button
          type="button"
          onClick={handleAcademicSeed}
          disabled={academicSeeding}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-primary hover:bg-accent text-white font-semibold transition-all disabled:opacity-50"
        >
          <FaBook /> {academicSeeding ? 'Adding Academic Data...' : 'Seed / Repair Academic Data'}
        </button>
      </div>
      <div className="glass-card max-w-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-danger/20 text-danger"><FaUserShield size={24} /></div>
          <div><h2 className="text-xl font-bold text-white">Create Admin User</h2><p className="text-gray-400 text-sm">Create a new admin or promote an existing user</p></div>
        </div>
        <form onSubmit={handleSeed} className="space-y-4">
          <div><label className="block text-sm text-gray-300 mb-2">Name</label><input type="text" value={seedForm.name} onChange={(e) => setSeedForm({...seedForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-danger" placeholder="Admin Name" required /></div>
          <div><label className="block text-sm text-gray-300 mb-2">Email</label><input type="email" value={seedForm.email} onChange={(e) => setSeedForm({...seedForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-danger" placeholder="admin@taskora.com" required /></div>
          <div><label className="block text-sm text-gray-300 mb-2">Password</label><input type="password" value={seedForm.password} onChange={(e) => setSeedForm({...seedForm, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-danger" placeholder="Min 6 characters" required minLength={6} /></div>
          <button type="submit" disabled={seeding} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-danger hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50"><FaKey /> {seeding ? 'Processing...' : 'Create / Promote Admin'}</button>
        </form>
      </div>
      <div className="glass-card max-w-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">System Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-400">API Version</span><span className="text-white">v1</span></div>
          <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-400">Authentication</span><span className="text-success">JWT + Role Based</span></div>
          <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-400">Real-time</span><span className="text-secondary">Socket.io</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-400">Database</span><span className="text-white">MongoDB</span></div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
