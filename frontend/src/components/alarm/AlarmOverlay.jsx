import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import useSocket from '../../hooks/useSocket';
import { alarmApi } from '../../services/alarmApi';
import { taskApi } from '../../services/taskApi';
import {
  setActiveAlarms,
  addAlarm,
  removeAlarm,
  setCurrentAlarm,
} from '../../redux/slices/alarmSlice';

const AlarmOverlay = () => {
  const dispatch = useDispatch();
  const { activeAlarms, currentAlarm, showOverlay } = useSelector((state) => state.alarms);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const socket = useSocket();
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const currentAlarmRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    currentAlarmRef.current = currentAlarm;
  }, [currentAlarm]);

  const playAlarmSound = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainRef.current = audioContextRef.current.createGain();
      gainRef.current.connect(audioContextRef.current.destination);
      gainRef.current.gain.value = 0.4;

      const playBeep = () => {
        if (!audioContextRef.current) return;
        const now = audioContextRef.current.currentTime;

        const osc1 = audioContextRef.current.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 880;
        osc1.connect(gainRef.current);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = audioContextRef.current.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = 660;
        osc2.connect(gainRef.current);
        osc2.start(now + 0.3);
        osc2.stop(now + 0.6);
      };

      playBeep();
      intervalRef.current = setInterval(playBeep, 1500);
    } catch {
      try {
        audioRef.current = new Audio();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          data[i] = Math.sin(2 * Math.PI * 880 * i / sampleRate) * 0.4;
        }
        const wavBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(wavBuffer);
        const writeStr = (offset, str) => {
          for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, length * 2, true);
        for (let i = 0; i < length; i++) {
          const sample = Math.max(-1, Math.min(1, data[i]));
          view.setInt16(44 + i * 2, sample * 0x7FFF, true);
        }
        const url = URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
        audioRef.current = new Audio(url);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(() => {});
      } catch {}
    }
  }, []);

  const stopAlarmSound = useCallback(() => {
    isPlayingRef.current = false;
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch {}
      try { oscillatorRef.current.disconnect(); } catch {}
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const triggerAlarmUI = useCallback((alarm) => {
    dispatch(setCurrentAlarm(alarm));
    playAlarmSound();

    if (Notification.permission === 'granted') {
      new Notification('⚠️ TASK NOT COMPLETED', {
        body: `"${alarm.title}" is overdue! Complete immediately.`,
        icon: '/favicon.svg',
        tag: `alarm-${alarm._id || alarm.taskId}`,
        requireInteraction: true,
      });
    }

    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
    }

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ALARM_TRIGGERED',
        title: alarm.title,
        taskId: alarm._id || alarm.taskId,
      });
    }
  }, [dispatch, playAlarmSound]);

  const authErrorCountRef = useRef(0);
  const pollingActiveRef = useRef(true);
  const isAuthenticatedRef = useRef(false);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const fetchActiveAlarms = useCallback(async () => {
    if (!pollingActiveRef.current) return;
    if (!isAuthenticatedRef.current) return;
    try {
      const data = await alarmApi.getActive();
      authErrorCountRef.current = 0;
      if (data.alarms?.length > 0) {
        dispatch(setActiveAlarms(data.alarms));
        if (!currentAlarmRef.current) {
          triggerAlarmUI(data.alarms[0]);
        }
      } else {
        const stored = JSON.parse(localStorage.getItem('activeAlarms') || '[]');
        if (stored.length > 0 && !currentAlarmRef.current) {
          dispatch(setActiveAlarms(stored));
          triggerAlarmUI(stored[0]);
        }
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        authErrorCountRef.current += 1;
        if (authErrorCountRef.current >= 3) {
          pollingActiveRef.current = false;
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }
        return;
      }
      const stored = JSON.parse(localStorage.getItem('activeAlarms') || '[]');
      if (stored.length > 0 && !currentAlarmRef.current) {
        dispatch(setActiveAlarms(stored));
        triggerAlarmUI(stored[0]);
      }
    }
  }, [dispatch, triggerAlarmUI]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchActiveAlarms();

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(fetchActiveAlarms, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchActiveAlarms, isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const handleTriggered = (data) => {
      dispatch(addAlarm({ _id: data.taskId, taskId: data.taskId, ...data }));
      triggerAlarmUI({ _id: data.taskId, taskId: data.taskId, ...data });
    };

    const handlePersistent = (data) => {
      dispatch(addAlarm({ _id: data.taskId, taskId: data.taskId, ...data }));
      if (!currentAlarmRef.current || currentAlarmRef.current.taskId === data.taskId) {
        triggerAlarmUI({ _id: data.taskId, taskId: data.taskId, ...data });
      }
    };

    const handleStopped = (data) => {
      dispatch(removeAlarm(data.taskId));
      if (currentAlarmRef.current?.taskId === data.taskId || currentAlarmRef.current?._id === data.taskId) {
        stopAlarmSound();
      }
    };

    const handleSync = (data) => {
      if (data.alarms?.length > 0) {
        dispatch(setActiveAlarms(data.alarms));
        if (!currentAlarmRef.current) {
          triggerAlarmUI(data.alarms[0]);
        }
      }
    };

    socket.on('alarm:triggered', handleTriggered);
    socket.on('alarm:persistent', handlePersistent);
    socket.on('alarm:stopped', handleStopped);
    socket.on('alarm:sync', handleSync);

    socket.emit('alarm:sync-request');

    return () => {
      socket.off('alarm:triggered', handleTriggered);
      socket.off('alarm:persistent', handlePersistent);
      socket.off('alarm:stopped', handleStopped);
      socket.off('alarm:sync', handleSync);
    };
  }, [socket, dispatch, triggerAlarmUI, stopAlarmSound]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'activeAlarms') {
        const stored = JSON.parse(e.newValue || '[]');
        if (stored.length > 0) {
          dispatch(setActiveAlarms(stored));
          if (!currentAlarmRef.current) {
            triggerAlarmUI(stored[0]);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dispatch, triggerAlarmUI]);

  useEffect(() => {
    return () => {
      stopAlarmSound();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [stopAlarmSound]);

  const handleComplete = async () => {
    if (!currentAlarm) return;
    const taskId = currentAlarm._id || currentAlarm.taskId;
    try {
      await alarmApi.complete(taskId);
      stopAlarmSound();
      dispatch(removeAlarm(taskId));
    } catch {
      try {
        await taskApi.toggle(taskId);
        stopAlarmSound();
        dispatch(removeAlarm(taskId));
      } catch {}
    }
  };

  const getOverdueText = () => {
    if (!currentAlarm) return '';
    if (currentAlarm.overdue) return currentAlarm.overdue;
    if (currentAlarm.dueDate) {
      const diff = Date.now() - new Date(currentAlarm.dueDate).getTime();
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      return `${hrs > 0 ? `${hrs}h ` : ''}${mins % 60}m`;
    }
    return '';
  };

  return (
    <AnimatePresence>
      {showOverlay && currentAlarm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          style={{ cursor: 'default' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass-card max-w-lg w-full p-8 text-center border-2 border-danger/50"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-6xl mb-6 flex justify-center"
            >
              <FaExclamationTriangle className="text-danger" />
            </motion.div>

            <h1 className="text-3xl font-bold text-danger mb-2">⚠️ TASK NOT COMPLETED</h1>
            <div className="w-16 h-1 bg-danger mx-auto mb-6 rounded-full" />

            <div className="space-y-4 mb-8">
              <div className="glass rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Task</p>
                <p className="text-white text-xl font-bold">{currentAlarm.title}</p>
              </div>

              {currentAlarm.dueDate && (
                <div className="glass rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Due</p>
                  <p className="text-white text-lg">
                    {new Date(currentAlarm.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}

              <div className="glass rounded-xl p-4 border border-danger/30">
                <p className="text-gray-400 text-sm mb-1">Overdue</p>
                <p className="text-danger text-lg font-bold flex items-center justify-center gap-2">
                  <FaClock /> {getOverdueText()}
                </p>
              </div>
            </div>

            <p className="text-gray-400 mb-8">
              Please complete this task immediately. The alarm will continue until completed.
            </p>

            <button
              onClick={handleComplete}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-success hover:bg-green-600 text-white font-semibold transition-all text-lg"
            >
              <FaCheck /> Complete Task
            </button>

            <p className="text-gray-600 text-xs mt-4">
              Alarm cannot be dismissed. You must complete the task to stop it.
            </p>
          </motion.div>
        </motion.div>
      )}

      {activeAlarms.length > 0 && !showOverlay && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => {
            if (activeAlarms.length > 0) {
              triggerAlarmUI(activeAlarms[0]);
            }
          }}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-danger text-white shadow-lg shadow-danger/50 animate-pulse"
        >
          <FaBell className="text-xl" />
          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-danger text-xs font-bold flex items-center justify-center">
            {activeAlarms.length}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default AlarmOverlay;
