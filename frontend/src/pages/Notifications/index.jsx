import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaCheckDouble, FaTrash } from 'react-icons/fa';
import NotificationCard from '../../components/notifications/NotificationCard';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import { notificationApi } from '../../services/notificationApi';
import BackButton from '../../components/ui/BackButton';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadNotifications(); }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? { read: 'false' } : {};
      const data = await notificationApi.getAll(params);
      setNotifications(data.notifications || []);
    } catch {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      loadNotifications();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      loadNotifications();
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === 'all' ? 'bg-primary text-white' : 'glass text-gray-400'}`}>All</button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === 'unread' ? 'bg-primary text-white' : 'glass text-gray-400'}`}>Unread</button>
          <button onClick={handleMarkAllRead} className="px-4 py-2 rounded-xl glass text-gray-400 hover:text-white flex items-center gap-1 text-sm"><FaCheckDouble /> Mark All Read</button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FaBell size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard key={notification._id} notification={notification} onMarkRead={handleMarkRead} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Notifications;
