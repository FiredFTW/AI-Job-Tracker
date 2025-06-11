import express from 'express';
import authRoutes from './auth.js';
import tasksRoutes from './tasks.js';
import applicationsRoutes from './applications.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Hello from the master API router!' });
});

// Mount other routers
router.use('/auth', authRoutes);
router.use('/tasks', tasksRoutes);
router.use('/applications', applicationsRoutes);

export default router;