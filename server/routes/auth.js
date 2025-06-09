// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { google } from 'googleapis';
import auth from '../middleware/auth.js'; 

const prisma = new PrismaClient();
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/auth/google/callback' // The redirect URI
);

// --- Registration Route ---
router.post(
  '/register',
  // Input validation
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // 1. Check if user already exists
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // 2. Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 3. Create the new user
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      // 4. Create and return a JWT
      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET, // You need to add this to your .env file!
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// --- Login Route ---
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // 1. Check if user exists
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // 2. Compare the provided password with the hashed password in the DB
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // 3. If they match, create and return a JWT
      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/auth/google/url
// @desc    Get the Google OAuth2 consent page URL
// @access  Private
router.get('/google/url', auth, (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: req.user.id.toString(),
  });

  // Instead of redirecting, send the URL back to the front-end
  res.json({ url });
});

// @route   GET /api/auth/google/callback
// @desc    Handle the callback from Google
// @access  Public (but we use the 'state' to identify the user)
router.get('/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!userId || !code) {
    return res.redirect('http://localhost:5173/jobs?error=invalid_request');
  }

  try {
    const freshClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:5000/api/auth/google/callback'
    );
    
    const { tokens } = await freshClient.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        googleAccessToken: access_token,
        googleRefreshToken: refresh_token || undefined,
        googleTokenExpiry: expiry_date ? new Date(expiry_date) : null,
      },
    });

    res.redirect('http://localhost:5173/jobs');
  } catch (error) {
    // Log the detailed error to see the exact reason from Google
    console.error('Error exchanging Google code for tokens:', error.response?.data || error.message);
    res.redirect('http://localhost:5173/jobs?error=token_exchange_failed');
  }
});

export default router;