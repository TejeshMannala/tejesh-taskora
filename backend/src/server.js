import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import { initializeSocket } from './sockets/index.js';
import { initRedis } from './services/redis.service.js';
import { startReminderCron } from './cron/reminder.cron.js';
import { verifyTransporter } from './services/email.service.js';

dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskora';

// ── Global error handlers ──────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

// ── MongoDB connection event listeners ────────────────────────────────
mongoose.connection.on('connected', () => {
  console.log('Mongoose connection established');
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose connection lost — will auto-reconnect');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('reconnect', () => {
  console.log('Mongoose reconnected');
});

// ── Server setup ───────────────────────────────────────────────────────
const server = http.createServer(app);

const io = initializeSocket(server);

const startServer = (port) => {
  server.listen(port)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.log(`Port ${port} busy, switching to ${nextPort}`);
        server.close(() => startServer(nextPort));
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      console.log(`Server running on port ${port}`);
    });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
  });
  try {
    await mongoose.connection.close();
  } catch (_) { /* ignore close errors during shutdown */ }
  console.log('MongoDB disconnected');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Connect to MongoDB ─────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    w: 'majority',
  })
  .then(async () => {
    console.log('MongoDB Connected');
    await initRedis();

    // Import User model (must happen AFTER connection for index sync to work)
    let User;
    try {
      const mod = await import('./models/user.model.js');
      User = mod.default;
    } catch (err) {
      console.error('Failed to load User model:', err.message);
    }

    if (User) {
      try {
        await User.syncIndexes();
        console.log('User indexes synced (unique email constraint enforced)');
      } catch (err) {
        console.error('Failed to sync User indexes:', err.message);
      }
    }

    // Auto-seed default admin
    if (User) {
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminEmail && adminPassword) {
          const existing = await User.findOne({ email: adminEmail });
          if (existing) {
            if (existing.role !== 'admin') {
              existing.role = 'admin';
              await existing.save();
              console.log(`Admin: Promoted ${adminEmail} to admin`);
            }
          } else {
            await User.create({
              name: 'Admin',
              email: adminEmail,
              password: adminPassword,
              role: 'admin',
            });
            console.log(`Admin: Created default admin (${adminEmail})`);
          }
        }
      } catch (err) {
        console.error('Admin seed error:', err.message);
      }
    }

    startReminderCron();

    // Verify SMTP connection proactively
    const smtpOk = await verifyTransporter();
    if (!smtpOk) {
      console.warn('[SMTP] Email sending will fail — check .env MAIL_USER / MAIL_PASS');
    }

    startServer(PORT);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
