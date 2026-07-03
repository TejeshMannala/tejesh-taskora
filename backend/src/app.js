import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://tejesh-taskora-frontend.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const matchOrigin = allowedOrigins.find((o) => origin.startsWith(o.replace(/\/+$/, '')));
    if (matchOrigin) return callback(null, true);
    const feUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
    if (feUrl && origin.startsWith(feUrl)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());
app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'OK',
    message: 'TASKORA API is running',
    mode: dbConnected ? 'normal' : 'degraded',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/google', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  res.json({
    success: true,
    clientId: {
      present: !!googleClientId,
      valid: !!(googleClientId && !googleClientId.includes('your_') && googleClientId.length >= 20 && googleClientId.includes('.apps.googleusercontent.com')),
      prefix: googleClientId ? googleClientId.substring(0, 15) + '...' : null,
    },
    clientSecret: {
      present: !!googleClientSecret,
      placeholder: googleClientSecret?.includes('YOUR_') || false,
    },
    jwtSecret: {
      present: !!process.env.JWT_SECRET,
      placeholder: process.env.JWT_SECRET?.includes('replace_me') || false,
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  });
});

app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  let dbPing = null;
  if (dbState === 1) {
    try {
      const admin = mongoose.connection.db?.admin();
      if (admin) {
        const result = await admin.ping();
        dbPing = result?.ok === 1 ? 'ok' : 'fail';
      } else {
        dbPing = 'no-admin-access';
      }
    } catch {
      dbPing = 'error';
    }
  }

  const mode = dbState === 1 ? 'normal' : 'degraded';

  res.json({
    success: true,
    mode,
    server: {
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
    },
    database: {
      status: dbStatus[dbState] || 'unknown',
      connected: dbState === 1,
      ping: dbPing,
      host: mongoose.connection.host || 'not available',
      name: mongoose.connection.name || 'not available',
    },
    auth: {
      google: {
        configured: !!(googleClientId && googleClientId.length >= 20 && googleClientId.includes('.apps.googleusercontent.com')),
        clientIdPrefix: googleClientId ? googleClientId.substring(0, 15) + '...' : 'not set',
        clientSecretPresent: !!googleClientSecret && !googleClientSecret.includes('YOUR_'),
      },
      jwt: {
        configured: !!process.env.JWT_SECRET,
        secretPresent: !!process.env.JWT_SECRET,
        secretPlaceholder: process.env.JWT_SECRET?.includes('replace_me') || false,
        expiresIn: process.env.JWT_EXPIRE || '30d',
      },
    },
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins,
    },
  });
});

import apiRoutes from './routes/index.js';

// Database availability middleware — returns 503 when MongoDB is disconnected
app.use('/api/v1', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable — database connection is being established',
      retryAfter: 5,
    });
  }
  next();
});

app.use('/api/v1', apiRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
