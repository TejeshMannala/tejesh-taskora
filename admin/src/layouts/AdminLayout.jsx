import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTachometerAlt, FaBook, FaLayerGroup, FaBookOpen, FaUsers, FaTasks, FaStickyNote, FaCog, FaSignOutAlt, FaBars, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const adminMenu = [
  { label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
  { label: 'Education', icon: <FaBook />, path: '/courses' },
  { label: 'Groups', icon: <FaLayerGroup />, path: '/groups' },
  { label: 'Subjects', icon: <FaBookOpen />, path: '/subjects' },
  { label: 'Users', icon: <FaUsers />, path: '/users' },
  { label: 'Tasks', icon: <FaTasks />, path: '/tasks' },
  { label: 'Notes', icon: <FaStickyNote />, path: '/notes' },
  { label: 'Settings', icon: <FaCog />, path: '/settings' },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.adminAuth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-danger/20 text-danger"
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        className={`fixed left-0 top-0 h-screen z-40 glass border-r border-white/10 overflow-hidden ${mobileOpen ? 'block' : 'hidden'} lg:block`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-danger flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm" />
              </div>
              <span className="text-xl font-bold text-white">ADMIN</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all hidden lg:block">
            {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-70px)]">
          {adminMenu.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 3 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive(item.path)
                    ? 'bg-danger/20 text-danger font-medium'
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

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-gray-500 text-xs truncate">Admin</p>
              </div>
            )}
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-danger transition-all" title="Logout">
              <FaSignOutAlt size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <main className={`pt-6 pb-10 px-4 md:px-8 transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
