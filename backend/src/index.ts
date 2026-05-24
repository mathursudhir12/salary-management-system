import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// ── Routes ────────────────────────────────────────────────────────────────────
import employeeRouter from './routes/employee.routes';
import insightsRouter from './routes/insights.routes';

// ── Middleware ────────────────────────────────────────────────────────────────
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Request middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/employees', employeeRouter);
app.use('/api/insights',  insightsRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler (must be last — 4-param signature) ───────────────────
app.use(errorHandler);

// ── Start server (guard prevents double-listen when required by tests) ─────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
  });
}

export default app;
