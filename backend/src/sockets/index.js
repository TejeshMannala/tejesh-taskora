import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import User from '../models/user.model.js';
import { setSocketIO } from '../services/notification.service.js';

let io = null;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    connectTimeout: 10000,
    pingTimeout: 5000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  setSocketIO(io);

  // Public namespace for unauthenticated users (signup page, landing page)
  const publicNamespace = io.of('/public');
  publicNamespace.on('connection', (socket) => {
    console.log(`Public socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Public socket disconnected: ${socket.id}`);
    });
  });

  // Helper to emit academic updates to both namespaces
  const emitAcademicUpdate = (data) => {
    io.emit('academic:updated', data);
    publicNamespace.emit('academic:updated', data);
  };

  // Attach helper to io for use in controllers
  io.emitAcademicUpdate = emitAcademicUpdate;

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      // Join user-specific room
      socket.join(socket.user._id.toString());

      // Update user online status
      await User.findByIdAndUpdate(socket.user._id, { isOnline: true, lastActive: new Date() }, { returnDocument: 'after' });

      // Broadcast online status
      io.emit('user:online', { userId: socket.user._id, isOnline: true });
    } catch (err) {
      console.error('Socket connection init error:', err.message);
    }

    // Join study session room
    socket.on('session:join', (sessionId) => {
      socket.join(`session:${sessionId}`);
    });

    // Leave study session room
    socket.on('session:leave', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    // Focus timer updates
    socket.on('focus:tick', (data) => {
      socket.to(`session:${data.sessionId}`).emit('focus:sync', data);
    });

    // Task completed
    socket.on('task:completed', async (taskId) => {
      io.to(socket.user._id.toString()).emit('task:updated', { taskId, status: 'Completed' });
    });

    // Real-time notification
    socket.on('notification:send', (data) => {
      io.to(data.userId).emit('notification', data);
    });

    // Alarm acknowledgment (snooze for 5 min)
    socket.on('alarm:snooze', async (data) => {
      try {
        const { default: Task } = await import('../models/task.model.js');
        const task = await Task.findOne({ _id: data.taskId, user: socket.user._id });
        if (task) {
          task.alarmStartedAt = new Date(Date.now() + 5 * 60 * 1000);
          await task.save();
        }
      } catch (err) {
        console.error('alarm:snooze error:', err.message);
      }
    });

    // Admin broadcast - course/group/subject changes
    socket.on('admin:update', (data) => {
      io.emitAcademicUpdate({ type: data.type, action: data.action });
    });

    // Send active alarms on reconnection for persistence
    socket.on('alarm:sync-request', async () => {
      try {
        const { default: Task } = await import('../models/task.model.js');
        const activeAlarms = await Task.find({
          user: socket.user._id,
          completed: false,
          alarmTriggered: true,
          alarmActive: true,
          dueDate: { $lte: new Date() },
        }).sort({ dueDate: 1 });

        if (activeAlarms.length > 0) {
          socket.emit('alarm:sync', { alarms: activeAlarms });
        }
      } catch (err) {
        console.error('alarm:sync-request error:', err.message);
      }
    });

    // Admin notes update broadcast
    socket.on('notes:admin-update', (data) => {
      io.emit('notes:updated', data);
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      socket.to(data.room).emit('typing:start', { userId: socket.user._id, name: socket.user.name });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.room).emit('typing:stop', { userId: socket.user._id });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);
      try {
        await User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastActive: new Date() });
        io.emit('user:offline', { userId: socket.user._id, isOnline: false });
      } catch (err) {
        console.error('Socket disconnect handler error:', err.message);
      }
    });
  });

  return io;
};

export const getIO = () => io;
