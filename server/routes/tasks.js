import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js'; // <-- Import the middleware

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET api/tasks
// @desc    Get all of a user's tasks
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id }, // We get req.user.id from the auth middleware!
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tasks
// @desc    Create a task
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ msg: 'Title is required' });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        userId: req.user.id,
      },
    });
    res.json(newTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// We will build PUT and DELETE next, let's start with these two.
// ...

export default router;