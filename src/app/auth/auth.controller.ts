import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from './jwt.util';
import { createUser, findUserByEmail } from './auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, image } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const newUser = await createUser(name, email, password, image);

    // Optionally we can generate a token immediately
    const token = generateToken(newUser.id, newUser.role as string);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        image: newUser.image
      }
    });

  } catch (error: any) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role as string);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
