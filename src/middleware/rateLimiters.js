const { rateLimit } = require('express-rate-limit');

const skipInTests = () => process.env.NODE_ENV === 'test';

// General limit for the whole API
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: 'Too many requests, please try again later' },
});

// Stricter limit on login/register to slow down password guessing.
// Successful requests are not counted, only failed ones.
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: 'Too many failed attempts, please try again in 15 minutes' },
});