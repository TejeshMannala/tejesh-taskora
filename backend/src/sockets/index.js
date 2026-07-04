import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { setSocketIO } from '../services/notification.service.js';

let io = null;

export const getIO = () => io;

export const initializeSocket = (server) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          frontendUrl,
          'http://localhost:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5173',
          'https://tejesh-taskora-frontend.onrender.com',
        ];
        if (!origin || allowedOrigins.some((o) => origin.startsWith(o.replace(/\/+$/, '')))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (socket: ${socket.id})`);

    socket.join(socket.userId.toString());

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${socket.userId} (reason: ${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error for user ${socket.userId}:`, err.message);
    });
  });

  setSocketIO(io);

  console.log('[Socket] Socket.IO initialized');
  return io;
};
