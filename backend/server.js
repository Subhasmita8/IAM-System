// server.js
// Express application entry point
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

const { testConnection }           = require('./config/db');
const { apiLimiter }               = require('./middleware/rateLimiter');
const { errorHandler, notFound }   = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');

const app = express();

// ─── Trust proxy (needed if behind nginx/load balancer) ──────
app.set('trust proxy', 1);

// ─── CORS ─────────────────────────────────────────────────────

app.use(cors({
  origin: 'https://iam-system.vercel.app',
  credentials: true
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));         // Prevent large payload attacks
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ─── Global Rate Limiting ─────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);

// Convenience alias: POST /assign-role → /roles/assign
app.use('/assign-role', (req, res, next) => {
  req.url = '/assign';
  roleRoutes(req, res, next);
});

app.get('/test', (req, res) => {
  res.json({ message: 'Backend working' });
});

// ─── 404 + Error Handlers (must be last) ──────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 IAM Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


module.exports = app;
