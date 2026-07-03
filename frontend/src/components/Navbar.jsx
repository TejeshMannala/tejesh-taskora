import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaBell, FaMoon, FaSun, FaUser, FaCog, FaQuestionCircle, FaSignOutAlt, FaArrowLeft, FaBars } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { searchApi } from '../services/searchApi';
import { notificationApi } from '../services/notificationApi';
import useTheme from '../hooks/useTheme';
import toast from 'react-hot-toast';
import { API_BASE } from '../services/api';

const getApiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_BASE}${path}`;
};

const Navbar = ({ onMenuToggle }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);

  const profilePic = user?.profilePicture || user?.avatar || '';

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (isAuthenticated) { loadUnreadCount(); }
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const data = await searchApi.global(searchQuery);
          setSearchResults(data.results || []);
        } catch {}
      } else { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch {}
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out');
  };

  const navigateToResult = (result) => {
    const routes = {
      task: '/tasks',
      subject: '/subjects',
      notification: '/notifications',
    };
    navigate(routes[result.type] || '/home');
    setShowSearch(false);
    setSearchQuery('');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';

  if (!isAuthenticated || isAuthPage) {
    return (
      <nav className="fixed w-full z-30 glass px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border-2 border-primary flex items-center justify-center">
            <div className="w-3 h-3 bg-accent rounded-sm" />
          </div>
          <span className="text-2xl font-bold tracking-wider text-white">TASK<span className="text-primary">ORA</span></span>
        </Link>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 rounded-full font-medium text-white hover:text-primary transition-colors">Login</Link>
          <Link to="/signup" className="px-6 py-2 rounded-full font-medium bg-primary hover:bg-accent text-white transition-all shadow-lg hover:shadow-primary/50">Get Started</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 lg:left-60 right-0 z-30 glass px-4 md:px-8 py-3 flex items-center justify-between gap-4 transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          aria-label="Toggle menu"
        >
          <FaBars size={18} />
        </button>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/home');
            }
          }}
          className="hidden md:flex p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <FaArrowLeft size={18} />
        </button>
        <div className="relative flex-1 max-w-md hidden md:block">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input
            type="text" placeholder="Search tasks and subjects..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <AnimatePresence>
            {showSearch && searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 left-0 right-0 glass-card p-2 max-h-80 overflow-y-auto"
              >
                {searchResults.map((result) => (
                  <button key={`${result.type}-${result.id}`} onClick={() => navigateToResult(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left transition-all"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: result.color || '#7c3aed' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{result.title}</p>
                      <p className="text-gray-500 text-xs">{result.subtitle}</p>
                    </div>
                    <span className="text-xs text-gray-600 capitalize flex-shrink-0">{result.type}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all">
          {isClient && theme === 'dark' ? <FaSun size={16} /> : <FaMoon size={16} />}
        </button>
        <Link to="/notifications" className="relative p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all">
          <FaBell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white overflow-hidden">
              {profilePic ? (
                <img src={getApiUrl(profilePic)} alt={user?.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <span className="text-white text-sm font-medium hidden md:block">{user?.name || 'User'}</span>
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-56 glass-card p-2"
              >
                <div className="px-3 py-2 border-b border-white/10 mb-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                    {profilePic ? (
                      <img src={getApiUrl(profilePic)} alt={user?.name} className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                    <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-all">
                  <FaUser size={14} /> My Profile
                </Link>
                <Link to="/settings" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-all">
                  <FaCog size={14} /> Settings
                </Link>
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-all">
                  <FaQuestionCircle size={14} /> Help
                </a>
                <hr className="border-white/10 my-1" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-danger hover:bg-danger/10 text-sm transition-all">
                  <FaSignOutAlt size={14} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
