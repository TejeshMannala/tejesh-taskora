import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.adminAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(adminLogin({ email, password })).unwrap();
      toast.success('Admin login successful');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-danger flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-400 mt-2">Sign in to manage Taskora</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger transition-colors"
              placeholder="admin@taskora.com" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger transition-colors"
              placeholder="Enter password" required
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit" disabled={isLoading}
            className="w-full py-3 rounded-xl bg-danger hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="http://localhost:5173/login" className="text-sm text-gray-500 hover:text-secondary transition-colors">
            ← Back to Student Login
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
