import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaKey, FaTrash, FaSignOutAlt, FaMoon, FaBell } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout } from '../../redux/slices/authSlice';
import { userApi } from '../../services/userApi';
import BackButton from '../../components/ui/BackButton';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await userApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This cannot be undone!')) return;
    try {
      await userApi.deleteAccount();
      dispatch(logout());
      navigate('/');
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
      <BackButton to="/dashboard" />
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FaKey className="text-primary" /> Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Password</label>
            <input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">New Password</label>
              <input type="password" required minLength={6} value={passwordForm.newPassword} onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
              <input type="password" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary" />
            </div>
          </div>
          <button type="submit" className="px-6 py-3 rounded-xl bg-primary hover:bg-accent text-white font-medium transition-all">Update Password</button>
        </form>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-4">Account Actions</h2>
        <div className="space-y-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3"><FaSignOutAlt className="text-yellow-500" /> <div><p className="text-white font-medium">Sign Out</p><p className="text-gray-500 text-sm">Log out of your account</p></div></div>
            <span className="text-gray-500">&rarr;</span>
          </button>
          <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 transition-all text-left">
            <div className="flex items-center gap-3"><FaTrash className="text-danger" /> <div><p className="text-white font-medium">Delete Account</p><p className="text-gray-500 text-sm">Permanently delete your account and data</p></div></div>
            <span className="text-danger">&rarr;</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
