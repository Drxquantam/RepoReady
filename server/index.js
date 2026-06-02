import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import aiRouter from './routes/ai.js';
import auditsRouter from './routes/audits.js';
import { logError, logInfo, requestLogger } from './utils/logger.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:5174';
const allowedOrigins = new Set([
  ...parseOrigins(clientUrl),
  ...parseOrigins(process.env.CLIENT_URLS),
  'http://127.0.0.1:5174',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(Object.assign(new Error(`Origin ${origin} is not allowed by CORS`), { status: 403 }));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'RepoReady API',
    message: 'Backend is running. Connect the React frontend with VITE_API_URL pointing to this Render URL plus /api.',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'RepoReady API',
    storage: process.env.STORAGE_DRIVER === 'aws' ? 'aws-s3-dynamodb' : 'local-file',
    awsReady: true,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/audits', auditsRouter);
app.use('/api/ai', aiRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const message = err.code === 'LIMIT_FILE_SIZE'
    ? `Project ZIP is too large. Current limit is ${process.env.MAX_UPLOAD_MB || 25} MB. Remove node_modules/.git/build folders or raise MAX_UPLOAD_MB.`
    : err.message || 'Unexpected server error';
  logError('request_error', err, { status });
  res.status(status).json({
    error: message,
  });
});

app.listen(port, () => {
  logInfo('api_started', {
    port,
    storageDriver: process.env.STORAGE_DRIVER || 'local',
    awsRegion: process.env.AWS_REGION || 'ap-south-1',
  });
});

function parseOrigins(value = '') {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
