import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { generateToken, generateRefreshToken, verifyRefreshToken } from './jwt.util';
import { createUser, findUserByEmail } from './auth.service';

// ── Register ──────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, image } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const newUser = await createUser(name, email, password, image);

    const token        = generateToken(newUser.id, newUser.role as string);
    const refreshToken = generateRefreshToken(newUser.id, newUser.role as string);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        image: newUser.image,
      },
    });
  } catch (error: any) {
    if (error.message === 'User already exists') error.status = 409;
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token        = generateToken(user.id, user.role as string);
    const refreshToken = generateRefreshToken(user.id, user.role as string);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
// When the access token (token) expires, client sends the refreshToken here
// to get a brand-new token + refreshToken pair.

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: tokenFromContext } = req.body;
    const token = tokenFromContext || req.cookies?.refreshToken;

    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify signature & expiry — same pattern as verifyToken
    const payload = verifyRefreshToken(token);

    // Issue a fresh pair
    const newToken        = generateToken(payload.userId, payload.role);
    const newRefreshToken = generateRefreshToken(payload.userId, payload.role);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken,
    });
  } catch (error: any) {
    if (error.message === 'Invalid or expired refresh token') {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
// Stateless — just tell the client to discard both tokens.

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};
