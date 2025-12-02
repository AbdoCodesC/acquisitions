import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user ? req.user.role : 'guest';
    let limit;
    let message;
    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin rate limit exceeded (20 per min). Slow down.';
        break;
      case 'user':
        limit = 10;
        message = 'User rate limit exceeded (10 per min). Slow down.';
        break;
      default:
        limit = 5;
        message = 'Guest rate limit exceeded.';
    }
    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn(`Bot request blocked`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed.',
      });
    }
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn(`Shield request blocked`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        method: req.method,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed.',
      });
    }
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn(`Rate limit exceeded`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        method: req.method,
      });
      return res.status(429).json({
        error: 'Forbidden',
        message: 'Too many requests. Please slow down.',
      });
    }

    next();
  } catch (error) {
    logger.error('Arcjet middleware error: ' + error.message);
    res.status(500).json({
      error: 'Internal server error.',
      message: 'Something went wrong with the security middleware.',
    });
  }
};

export default securityMiddleware;
