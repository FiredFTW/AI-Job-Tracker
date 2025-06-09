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

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth2 flow
// @access  Private (user must be logged in to connect their account)
router.get('/google', auth, (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly', // We only need to read emails
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // IMPORTANT: This gets us a refresh token
    scope: scopes,
    // We can pass the user's ID to know who to associate the token with on callback
    state: req.user.id.toString(), 
  });
  res.redirect(url);
});

// @route   GET /api/auth/google/callback
// @desc    Handle the callback from Google
// @access  Public (but we use the 'state' to identify the user)
router.get('/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!userId) {
    // Handle cases where state might be missing
    return res.redirect('http://localhost:5173/jobs?error=invalid_state');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        googleAccessToken: access_token,
        // IMPORTANT: Google only sends the refresh_token THE VERY FIRST TIME a user authorizes.
        // If the user already has one, we don't want to overwrite it with null.
        googleRefreshToken: refresh_token || undefined, 
        googleTokenExpiry: expiry_date ? new Date(expiry_date) : null,
      },
    });

    // Redirect the user back to their job tracker page
    res.redirect('http://localhost:5173/jobs');
  } catch (error) {
    console.error('Error getting Google tokens', error);
    res.redirect('http://localhost:5173/jobs?error=auth_failed');
  }
});

export default router;