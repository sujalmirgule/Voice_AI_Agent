import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/assets/')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRouter);

// Catch-all 404 for unmatched /api requests
app.all('/api/*', notFoundHandler);

// Serve built React frontend in production or if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for client-side SPA routing (local express serving)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Aura Voice CX API</title></head>
        <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
          <h1>Aura Skincare Voice CX Service</h1>
          <p>API is active. Visit <a href="/api/health" style="color: #38bdf8;">/api/health</a> or run the client build.</p>
        </body>
        </html>
      `);
    }
  });
});

// Global centralized error handler
app.use(errorHandler);

// Start server ONLY if executed directly (e.g. `node server/src/server.js`)
const isDirectRun = process.argv[1] && path.resolve(__filename) === path.resolve(process.argv[1]);
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🌿 Aura Skincare Voice CX Server Active`);
    console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

export default app;
