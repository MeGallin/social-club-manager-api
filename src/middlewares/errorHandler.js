const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error occurred:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  let error = {
    message: err.message || 'Internal Server Error',
    status: err.statusCode || err.status || 500,
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, status: 400 };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 400 };
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', status: 401 };
  }

  // Response payload
  const response = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.url,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = {
      name: err.name,
      statusCode: error.status,
    };
  }

  res.status(error.status).json(response);
};

// Handle 404 routes
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFound, asyncHandler };
