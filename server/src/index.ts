import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { logger } from './lib/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL || (isProd ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV);

// Middleware
app.use(cors({ origin: clientUrl || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' })); // Increased for bulk uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'debug';
    logger[level]('HTTP', `${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// Routes
import authRoutes from './routes/auth.js';
import brandRoutes from './routes/brands.js';
import categoryRoutes from './routes/categories.js';
import uploadRoutes from './routes/upload.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import cmsRoutes from './routes/cms.js';
import blogRoutes from './routes/blog.js';
import contactRoutes from './routes/contact.js';
import accountRoutes from './routes/account.js';

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/account', accountRoutes);

logger.info('Routes', 'All API routes registered', { count: 10 });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ABPATEL Hardware API is running', env: isProd ? 'production' : 'development' });
});

// 404 handler
app.use((req, res) => {
  logger.warn('HTTP', `Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server', 'Unhandled error', { error: err.message, stack: err.stack?.split('\n')[1]?.trim() });
  res.status(500).json({ message: 'Internal server error' });
});

// Start
app.listen(PORT, () => {
  logger.banner('ABPATEL Hardware API', PORT, isProd ? 'production' : 'development');
});
