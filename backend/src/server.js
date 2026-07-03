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

// ── Startup validation ──────────────────────────────────────────────────
const validateEnv = () => {
  const warnings = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback_secret') {
    warnings.push('JWT_SECRET is missing or using fallback — set a strong secret in .env');
  }
  if (!process.env.MONGO_URI) {
    warnings.push('MONGO_URI is not set — using default localhost');
  }
  const mailUser = process.env.MAIL_USER || process.env.SMTP_USER;
  const mailPass = process.env.MAIL_PASS || process.env.SMTP_PASS;
  if (!mailUser || !mailPass) {
    warnings.push('SMTP/MAIL credentials missing — email sending will fail');
  }
  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!googleId || googleId.includes('your_') || googleId.length < 20) {
    warnings.push('GOOGLE_CLIENT_ID is missing or invalid — Google SSO unavailable');
  }
  if (warnings.length > 0) {
    console.warn('── Startup Warnings ──────────────────────────────');
    warnings.forEach((w) => console.warn(`  ⚠  ${w}`));
    console.warn('──────────────────────────────────────────────────');
  }
  return warnings;
};

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

// ── Server setup (start IMMEDIATELY, before MongoDB) ──────────────────
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
        process.exit(1);
      }
    })
    .on('listening', () => {
      const actualPort = server.address().port;
      console.log(`Server running on port ${actualPort}`);
      // console.log(`FRONTEND_URL = ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
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

// ── Start HTTP server FIRST ──────────────────────────────────────────
validateEnv();
startServer(PORT);

// ── THEN initialize MongoDB and other services in background ─────────
async function initializeServices() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority',
    });
    console.log('MongoDB Connected');

    // Redis (best-effort)
    try {
      await initRedis();
    } catch (err) {
      console.log('Redis unavailable (non-fatal):', err.code || err.message);
    }

    // Import User model (must happen AFTER connection for index sync)
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

      // Auto-seed default admin
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

    // Start cron jobs
    startReminderCron();

    // Seed academic data
    try {
      const { ensureAcademicDefaults } = await import('./controllers/seed.controller.js');
      const seeded = await ensureAcademicDefaults();
      console.log(`[Seed] ${seeded.educations} education types, ${seeded.groups} groups, ${seeded.subjects} subjects, ${seeded.semesters} semesters`);
    } catch (err) {
      console.error('[Seed] Failed to seed academic data:', err.message);
    }

    // Verify SMTP
    const smtpOk = await verifyTransporter();
    if (!smtpOk) {
      console.warn('[SMTP] Email sending will fail — check .env MAIL_USER / MAIL_PASS');
    }

    console.log('All services initialized — server fully operational');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('───────────────────────────────────────────────────────────');
    console.log('  Server running in DEGRADED mode — database unavailable.');
    console.log('  Health check:  GET /api/health');
    console.log('  CORS origin:   ' + (process.env.FRONTEND_URL || 'http://localhost:5173'));
    console.log('───────────────────────────────────────────────────────────');
  }
}

initializeServices();
