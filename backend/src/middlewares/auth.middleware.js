import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const log = (msg, data = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [AuthMiddleware] ${msg}`, Object.keys(data).length ? JSON.stringify(data) : '');
};

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      log('Token received', { prefix: token.substring(0, 10) + '...' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      log('Token decoded', { userId: decoded.id });

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        log('User not found for decoded token', { decodedId: decoded.id });
        return res.status(401).json({ success: false, message: 'User not found. Account may have been deleted.' });
      }

      log('User authenticated', { userId: req.user._id.toString(), email: req.user.email });
      return next();
    } catch (error) {
      console.error(`[AuthMiddleware] JWT verification failed:`, error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please login again.', tokenExpired: true });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid authentication token. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  log('No token in request', { url: req.originalUrl });
  return res.status(401).json({ success: false, message: 'Not authorized, no token' });
};
