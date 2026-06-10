import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Register a new customer
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required' });
      return;
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.insert(users).values({
      email,
      name,
      phone,
      passwordHash,
      role: 'CUSTOMER', // Hardcode role for public registration
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

    // Generate token
    const token = jwt.sign(
      { userId: newUser[0].id, role: newUser[0].role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser[0],
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password (ensure user has a password)
    if (!user.passwordHash) {
      res.status(401).json({ message: 'Invalid credentials. Try logging in with your phone number.' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Firebase Phone Login / Registration
router.post('/phone-login', async (req, res) => {
  try {
    const { idToken, name } = req.body; // 'name' is optional, used if new user

    if (!idToken) {
      res.status(400).json({ message: 'Firebase ID token is required' });
      return;
    }

    const { firebaseAdmin } = await import('../lib/firebaseAdmin.js');
    if (!firebaseAdmin.apps.length) {
      res.status(500).json({ message: 'Firebase Admin not configured' });
      return;
    }

    // Verify token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const { uid, phone_number } = decodedToken;

    if (!phone_number) {
      res.status(400).json({ message: 'No phone number linked to this Firebase credential' });
      return;
    }

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.firebaseUid, uid),
    });

    if (!user) {
      // Maybe user exists by phone (legacy migration), check that
      user = await db.query.users.findFirst({
        where: eq(users.phone, phone_number),
      });

      if (user) {
        // Link firebase UID
        const updated = await db.update(users)
          .set({ firebaseUid: uid })
          .where(eq(users.id, user.id))
          .returning();
        user = updated[0];
      } else {
        // Create new phone user
        const newUser = await db.insert(users).values({
          firebaseUid: uid,
          phone: phone_number,
          name: name || 'Customer', // Default if not provided
          role: 'CUSTOMER',
        }).returning();
        user = newUser[0];
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    console.error('Phone login error:', error);
    res.status(500).json({ message: 'Failed to verify phone login' });
  }
});

export default router;
