const morgan = require('morgan');

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.get('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '';
});

// Custom format for development
const devFormat = ':method :url :status :res[content-length] - :response-time ms';

// Custom format for production
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Skip logging for health check in production
const skip = (req, res) => {
  if (process.env.NODE_ENV === 'production' && req.url === '/api/health') {
    return true;
  }
  return false;
};

const logger = process.env.NODE_ENV === 'production'
  ? morgan(prodFormat, { skip })
  : morgan(devFormat, { skip });

module.exports = logger;
