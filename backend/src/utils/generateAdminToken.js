import jwt from 'jsonwebtoken';

const generateAdminToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: 'admin' },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

export default generateAdminToken;
