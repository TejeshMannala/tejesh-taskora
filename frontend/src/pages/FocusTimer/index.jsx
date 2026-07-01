import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaStop, FaRedo, FaBrain } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { focusApi } from '../../services/focusApi';
import BackButton from '../../components/ui/BackButton';

const TIMER_PRESETS = [
  { label: 'Focus', minutes: 25 },
  { label: 'Short Break', minutes: 5 },
  { label: 'Long Break', minutes: 15 },
];

const FocusTimer = () => {
  const [activePreset, setActivePreset] = useState(0);
  const [seconds, setSeconds] = useState(TIMER_PRESETS[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [focusScore, setFocusScore] = useState(100);
  const [subject, setSubject] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSessions();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    setSeconds(TIMER_PRESETS[activePreset].minutes * 60);
  }, [activePreset]);

  const loadSessions = async () => {
    try {
      const data = await focusApi.getSessions({ limit: 5 });
      setSessions(data.sessions || []);
    } catch {}
  };

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [subject]);

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSeconds(TIMER_PRESETS[activePreset].minutes * 60);
    setFocusScore(100);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    const elapsedMinutes = (TIMER_PRESETS[activePreset].minutes * 60 - seconds) / 60;
    if (elapsedMinutes > 0.5) {
      handleSessionComplete();
    }
    resetTimer();
  };

  const handleSessionComplete = async () => {
    const elapsedMinutes = Math.round((TIMER_PRESETS[activePreset].minutes * 60 - seconds) / 60);
    if (elapsedMinutes < 1) return;

    const score = Math.max(0, Math.min(100, focusScore - Math.floor(Math.random() * 10)));
    try {
      await focusApi.saveSession({
        duration: elapsedMinutes,
        type: TIMER_PRESETS[activePreset].label,
        subjectName: subject,
        focusScore: score,
      });
      toast.success(`Session saved! ${elapsedMinutes} min completed.`);
      loadSessions();
    } catch {
      toast.error('Failed to save session');
    }
  };

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - (seconds / (TIMER_PRESETS[activePreset].minutes * 60));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <BackButton to="/dashboard" />
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Focus Timer</h1>
        <p className="text-gray-400 mt-1">Stay focused, one session at a time.</p>
      </div>

      <div className="glass-card p-8 max-w-lg mx-auto">
        <div className="flex justify-center gap-3 mb-8">
          {TIMER_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => { resetTimer(); setActivePreset(i); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activePreset === i ? 'bg-primary text-white' : 'glass text-gray-400 hover:text-white'}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" stroke="url(#timerGrad)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 264} 264`}
              transition={{ duration: 1 }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-white">{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
            <span className="text-gray-400 mt-2">{TIMER_PRESETS[activePreset].label}</span>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="What are you studying? (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <button onClick={startTimer} className="p-4 rounded-full bg-primary hover:bg-accent text-white transition-all shadow-lg shadow-primary/30">
              <FaPlay size={24} />
            </button>
          ) : (
            <button onClick={pauseTimer} className="p-4 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition-all">
              <FaPause size={24} />
            </button>
          )}
          <button onClick={stopTimer} className="p-4 rounded-full bg-danger/20 text-danger hover:bg-danger/30 transition-all">
            <FaStop size={20} />
          </button>
          <button onClick={resetTimer} className="p-4 rounded-full glass text-gray-400 hover:text-white transition-all">
            <FaRedo size={20} />
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FaBrain size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No sessions yet. Start your first focus session!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <div key={session._id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{session.subjectName || 'Study'}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">{session.type}</span>
                </div>
                <p className="text-2xl font-bold text-secondary">{session.duration}m</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(session.date).toLocaleDateString()}</p>
                {session.focusScore > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <FaBrain className="text-accent" /> Focus: {session.focusScore}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FocusTimer;
