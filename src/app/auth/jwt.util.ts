import jwt from 'jsonwebtoken';

// ── Access Token ──────────────────────────────────────────────────────────────

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not defined');
  return secret;
};

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('INVALID_TOKEN');
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is not defined');
  return secret;
};

export const generateRefreshToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, getRefreshSecret(), { expiresIn: '30d' });
};

export const verifyRefreshToken = (token: string): { userId: string; role: string } => {
  try {
    return jwt.verify(token, getRefreshSecret()) as { userId: string; role: string };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    throw new Error('INVALID_REFRESH_TOKEN');
  }
};
