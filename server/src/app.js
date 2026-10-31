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
