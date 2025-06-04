const express = require('express');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware
const corsMiddleware = require('./middlewares/cors');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Import routes
const healthRoutes = require('./routes/health');

// Initialize Express app
const app = express();

// Middleware
app.use(morgan('combined')); // Logging
app.use(corsMiddleware); // CORS
app.use(express.json({ limit: '10mb' })); // Body parser
app.use(express.urlencoded({ extended: true })); // URL encoded

// Routes
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Social Club Manager API',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
