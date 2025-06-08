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

// @route   PUT api/tasks/:id
// @desc    Update a task (e.g., mark as complete)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Find the task by its ID
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    // Check if the task exists and if the logged-in user owns it
    if (!task || task.userId !== req.user.id) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Update the task's isCompleted status
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { isCompleted: !task.isCompleted }, // Toggle the current status
    });

    res.json(updatedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!task || task.userId !== req.user.id) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;