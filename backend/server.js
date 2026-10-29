import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import lectureRoutes from './routes/lectures.js';
import progressRoutes from './routes/progress.js';
import adminRoutes from './routes/admin.js';
import adminTreeRoutes from './routes/admin-tree.js';
import browseRoutes from './routes/browse.js';

const app = express();

// ---------- Security & parsing ----------
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Logging ----------
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ---------- Rate limiting ----------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ---------- Health check ----------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'durus-backend',
    time: new Date().toISOString(),
  });
});

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminTreeRoutes);
app.use('/api/browse', browseRoutes);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---------- Error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

// ---------- Start ----------
const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`[server] Listening on http://localhost:${env.port}`);
    console.log(`[server] Environment: ${env.nodeEnv}`);
  });
};

start();