import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found. Account may have been deleted.' });
      }
      return next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please login again.', tokenExpired: true });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid authentication token. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token' });
};
