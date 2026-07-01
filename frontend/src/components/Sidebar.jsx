import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  FaHome, FaTasks, FaBook, FaBell, FaCog, FaChevronLeft, FaChevronRight, FaUser, FaClock
} from 'react-icons/fa';

const getApiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

const menuItems = [
  { label: 'Home', icon: <FaHome />, path: '/home' },
  { label: 'Profile', icon: <FaUser />, path: '/profile' },
  { label: 'Subjects', icon: <FaBook />, path: '/subjects' },
  { label: 'Tasks', icon: <FaTasks />, path: '/tasks' },
  { label: 'Reminders', icon: <FaClock />, path: '/reminders' },
  { label: 'Notifications', icon: <FaBell />, path: '/notifications' },
  { label: 'Settings', icon: <FaCog />, path: '/settings' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const profilePic = user?.profilePicture || user?.avatar || '';

  const isActive = (path) => {
    if (path === '/home') return location.pathname === path || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      className="fixed left-0 top-0 h-screen z-40 glass border-r border-white/10 hidden lg:block overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
            <span className="text-xl font-bold text-white">TASKORA</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
        </button>
      </div>

      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
            {profilePic ? (
              <img src={getApiUrl(profilePic)} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-gray-500 text-xs truncate">{user.educationType || 'Student'}</p>
          </div>
        </div>
      )}

      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-70px)]">
        {menuItems.map((item) => (
          <Link key={item.path + item.label} to={item.path}>
            <motion.div
              whileHover={{ x: 3 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive(item.path)
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </motion.div>
          </Link>
        ))}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
