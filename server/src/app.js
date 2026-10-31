import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import planRoutes from './routes/planRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration allowing cookies/credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        ENV.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
      ];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global API rate limiting
app.use('/api', apiLimiter);

// Root welcome and overview endpoint
app.get('/', (req, res) => {
  // If visited via web browser, render a clean developer dashboard page
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Brightloop Software — API Server</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
            .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px; max-width: 620px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4); }
            .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #fff; font-size: 24px; font-weight: 800; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3); }
            h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; color: #ffffff; }
            .desc { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
            .status-pill { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; background-color: #064e3b; color: #34d399; padding: 6px 14px; border-radius: 9999px; border: 1px solid #059669; margin-bottom: 24px; }
            .pulse { width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } 100% { opacity: 1; transform: scale(1); } }
            .btn-primary { display: inline-flex; align-items: center; justify-content: center; width: 100%; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 24px; font-weight: 600; font-size: 15px; border-radius: 10px; transition: all 0.15s ease; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); text-align: center; }
            .btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
            .info-box { background-color: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px; }
            .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
            .info-val { font-size: 13px; font-family: monospace; color: #cbd5e1; margin-top: 4px; word-break: break-all; }
            .credentials { margin-top: 24px; padding: 16px; background: rgba(15, 23, 42, 0.7); border: 1px dashed #334155; border-radius: 10px; font-size: 12px; color: #94a3b8; }
            .cred-title { font-weight: 700; color: #e2e8f0; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo-badge">B</div>
            <div>
              <span class="status-pill"><span class="pulse"></span> Backend REST API Online</span>
            </div>
            <h1>Brightloop Software API</h1>
            <p class="desc">
              You are accessing the Express REST API backend on port <strong>5000</strong>. The React frontend application is running on port <strong>5173</strong>.
            </p>
            <a href="http://localhost:5173" class="btn-primary">
              👉 Open Web Application (http://localhost:5173)
            </a>
            <div class="info-grid">
              <div class="info-box">
                <div class="info-label">API Health</div>
                <div class="info-val"><a href="/health" style="color:#818cf8; text-decoration:none;">/health → Status OK</a></div>
              </div>
              <div class="info-box">
                <div class="info-label">API Base Path</div>
                <div class="info-val">/api/v1/</div>
              </div>
            </div>
            <div class="credentials">
              <div class="cred-title">Demo User Credentials:</div>
              <div>• <strong>Admin:</strong> admin@brightloop.com / Admin@12345</div>
              <div>• <strong>Staff:</strong> staff1@brightloop.com / Staff@12345</div>
              <div>• <strong>Customer:</strong> billing@apexinnovations.io / Customer@12345</div>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  // JSON response for API clients
  res.status(200).json({
    success: true,
    system: 'Brightloop Subscription Management System API',
    version: '1.0.0',
    status: 'online',
    frontendUrl: ENV.CLIENT_URL,
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      plans: '/api/v1/plans',
      templates: '/api/v1/templates',
      subscriptions: '/api/v1/subscriptions',
      invoices: '/api/v1/invoices',
      payments: '/api/v1/payments',
      reports: '/api/v1/reports',
      customers: '/api/v1/customers',
      staff: '/api/v1/staff',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'Brightloop Subscription Management System API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/taxes', taxRoutes);
app.use('/api/v1/discounts', discountRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reports', reportRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
