import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { prisma } from './utils/prisma';
import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './modules/auth/auth.routes';
import rankingRoutes from './modules/ranking/ranking.routes';
import paymentRoutes from './modules/payments/payment.routes';
import productRoutes from './modules/products/product.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Trust reverse proxies (Vercel, Render, Cloudflare, ALB) for accurate client IP resolution & rate limiting
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS configuration supporting production domains, Vercel preview URLs, and local dev
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://beautybid.in',
  'https://www.beautybid.in',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const url = new URL(origin);
        if (
          allowedOrigins.includes(origin) ||
          url.hostname.endsWith('.vercel.app') ||
          url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1' ||
          config.nodeEnv === 'development'
        ) {
          return callback(null, true);
        }
      } catch {
        // invalid URL format, check direct equality
        if (allowedOrigins.includes(origin)) return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);

// Logging: Combined in production for audit trails, concise dev log in development
if (config.nodeEnv === 'production') {
  app.use(morgan('combined'));
} else if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Preserve raw body buffer for Razorpay Webhook signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiter across API
app.use('/api', generalLimiter);

// Health check with active database latency & connection probe
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = `disconnected: ${err.message}`;
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    platform: 'BeautyBid',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    currency: config.currency,
    disclaimer: 'Rankings are based on verified promotional spend and do not represent product quality.',
  });
});

// Mount modular API routers
app.use('/api/auth', authRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`✨ BeautyBid API server running on port ${config.port} (${config.nodeEnv})`);
    console.log(`🎯 Frontend URL: ${config.frontendUrl}`);
  });
}

export default app;
