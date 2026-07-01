import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Particles/Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <Navbar />

      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Stop Procrastinating. <br />
            <span className="text-gradient">Start Finishing.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            The premium student productivity platform. Plan, schedule, and actually complete your study goals with smart, persistent accountability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full bg-primary text-white font-bold text-lg shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all"
              >
                Start Your Journey
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full glass border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-all"
              >
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards Showcase */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
        >
          <div className="glass-card p-8 text-left group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6 text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Persistent Reminders</h3>
            <p className="text-gray-400">Aggressive notifications that won't stop until you actually start studying. We force you to be accountable.</p>
          </div>

          <div className="glass-card p-8 text-left group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-6 text-secondary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Study Analytics</h3>
            <p className="text-gray-400">Track your daily study hours, streaks, and subject-wise performance with beautiful dynamic charts.</p>
          </div>

          <div className="glass-card p-8 text-left group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-6 text-accent">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Gamification</h3>
            <p className="text-gray-400">Earn badges, maintain streaks, and climb the leaderboard as you conquer your academic goals.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
