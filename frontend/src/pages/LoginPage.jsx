import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaCheckCircle, FaEye, FaEyeSlash, FaSun, FaMoon } from 'react-icons/fa';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

import Navbar from '../components/Navbar';
import { login, googleLogin } from '../redux/slices/authSlice';
import { loginSchema } from '../utils/validations';
import ErrorModal from '../components/ui/ErrorModal';
import useTheme from '../hooks/useTheme';

const ParticlesCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${this.opacity})`;
        ctx.fill();
      }
    }

    const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 60);
    for (let i = 0; i < count; i++) particles.push(new Particle());

    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124, 58, 237, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      connect();
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      particles = [];
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  const { theme, toggleTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [shake, setShake] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [errorModal, setErrorModal] = useState({ isOpen: false, type: 'default', message: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const handleLogin = async (data) => {
    try {
      const response = await dispatch(login(data)).unwrap();
      if (response.success) {
        setUserName(response?.user?.name || 'there');
        setIsSuccess(true);
        setTimeout(() => navigate('/profile'), 2000);
      }
    } catch (error) {
      if (error?.message?.includes('already registered') || error?.message?.includes('already exists')) {
        setErrorModal({
          isOpen: true,
          type: 'duplicate-email',
          message: error.message,
        });
      } else {
        setErrorModal({
          isOpen: true,
          type: 'invalid-email',
          message: error?.message || error || 'Invalid email or password',
        });
      }
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);
    try {
      // credentialResponse can come from:
      //   <GoogleLogin>  component  -> { credential: 'ID_TOKEN_JWT' }
      //   useGoogleLogin() hook     -> { credential: 'ACCESS_TOKEN' }
      // Both are forwarded as-is to the backend which handles each type.
      const credential = credentialResponse?.credential || credentialResponse?.access_token;
      if (!credential) {
        throw new Error('No credential received from Google.');
      }
      const result = await dispatch(googleLogin(credential)).unwrap();
      if (result.success) {
        setIsSuccess(true);
        setUserName(result?.user?.name || 'there');
        setTimeout(() => navigate('/profile'), 2000);
      }
    } catch (error) {
      const msg = error?.message || error?.data?.message || 'Google login failed';
      if (msg.includes('not configured') || msg.includes('GOOGLE_CLIENT_ID')) {
        setErrorModal({
          isOpen: true,
          type: 'google-auth',
          title: 'Google Not Configured',
          message: msg,
        });
      } else if (msg.includes('already registered')) {
        setErrorModal({
          isOpen: true,
          type: 'duplicate-email',
          message: msg,
        });
      } else {
        setErrorModal({
          isOpen: true,
          type: 'google-auth',
          message: msg,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    setIsGoogleLoading(false);
    setErrorModal({
      isOpen: true,
      type: 'google-auth',
      title: 'Google Login Failed',
      message: error?.message || 'Google login encountered an error. Please try again or use email login.',
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-background transition-colors duration-300">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 z-0 animate-gradient bg-gradient-to-br from-primary/15 via-transparent to-secondary/15" />

      {/* Second gradient layer for depth */}
      <div className="fixed top-[-30%] left-[-10%] w-[70%] h-[70%] bg-accent/5 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Floating Particles */}
      <ParticlesCanvas />

      <Navbar />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-24 right-6 z-50 w-10 h-10 rounded-full glass flex items-center justify-center text-gray-300 hover:text-white transition-all hover:scale-110"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <FaSun size={16} /> : <FaMoon size={16} />}
      </button>

      <main className="flex-1 flex items-center justify-center px-6 relative z-10 pt-20">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-card p-12 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mb-6"
              >
                <FaCheckCircle size={50} />
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h2>
              <p className="text-gray-400">Let's complete today's goals!</p>
              <div className="mt-8 flex gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={shake ? { opacity: 1, y: 0, x: [-12, 12, -10, 10, -6, 6, 0] } : { opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="glass-card w-full max-w-md p-8 relative overflow-hidden"
            >
              {/* Card glow accent */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl font-bold mb-2"
                  >
                    Welcome Back
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400"
                  >
                    Sign in to continue your streak.
                  </motion.p>
                </div>

                {/* Google Login */}
                <div className="mb-6">
                  <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    isLoading={isGoogleLoading}
                    type="signin"
                  />
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-[#18181b] text-gray-400 transition-colors">or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        {...register('email')}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all duration-300 ${
                          errors.email ? 'border-red-500' : focusedField === 'email' ? 'border-primary shadow-[0_0_0_3px_rgba(124,58,237,0.15)]' : 'border-white/10'
                        }`}
                        placeholder="you@college.edu"
                      />
                      {errors.email && (
                        <FaCheckCircle className="absolute right-3 top-[14px] text-red-500 opacity-0" />
                      )}
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <span className="w-1 h-1 bg-red-400 rounded-full inline-block" />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all duration-300 ${
                          errors.password ? 'border-red-500' : focusedField === 'password' ? 'border-primary shadow-[0_0_0_3px_rgba(124,58,237,0.15)]' : 'border-white/10'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-[14px] text-gray-400 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <span className="w-1 h-1 bg-red-400 rounded-full inline-block" />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors">
                      <input type="checkbox" className="rounded bg-white/5 border-white/10 text-primary focus:ring-primary" />
                      Remember me
                    </label>
                    <Link to="/forgotten-password" className="text-primary hover:text-accent transition-colors">Forgot password?</Link>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-accent text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing In...</>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-secondary hover:text-white transition-colors font-medium">
                    Create one
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        type={errorModal.type}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
};

export default LoginPage;
