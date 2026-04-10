import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return secret;
};

export const generateToken = (userId: string, role: string): string => {
  const payload = { userId, role };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
