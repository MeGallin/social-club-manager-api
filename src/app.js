const express = require('express');
require('dotenv').config();

// Import middleware
const securityHeaders = require('./middlewares/security');
const corsMiddleware = require('./middlewares/cors');
const logger = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Import routes
const healthRoutes = require('./routes/health');

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses (important for logging and rate limiting)
app.set('trust proxy', 1);

// Security middleware (must be first)
app.use(securityHeaders);

// CORS middleware
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

// Logging middleware
app.use(logger);

// Routes
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Social Club Manager API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Test error endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/test-error', (req, res, next) => {
    const error = new Error('This is a test error');
    error.statusCode = 500;
    next(error);
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
