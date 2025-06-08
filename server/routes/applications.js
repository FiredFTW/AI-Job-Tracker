import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET api/applications
// @desc    Get all of a user's job applications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.id },
      orderBy: { appliedAt: 'desc' },
      // Include the related interactions for a full history!
      include: { interactions: true }, 
    });
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/applications
// @desc    Create a job application
// @access  Private
router.post('/', auth, async (req, res) => {
  const { company, role } = req.body;
  if (!company || !role) {
    return res.status(400).json({ msg: 'Company and role are required' });
  }
  try {
    const newApplication = await prisma.application.create({
      data: {
        company,
        role,
        userId: req.user.id,
      },
    });
    res.json(newApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/applications/:id
// @desc    Update a job application (for status, next step, dates, etc.)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  // We can update any field passed in the body
  const { company, role, status, nextStep, appliedAt, lastContactedAt } = req.body;

  try {
    // First, verify the application exists and belongs to the user
    const application = await prisma.application.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: parseInt(req.params.id) },
      data: {
        company,
        role,
        status,
        nextStep,
        appliedAt: appliedAt === null ? null : (appliedAt ? new Date(appliedAt) : undefined),
        lastContactedAt: lastContactedAt === null ? null : (lastContactedAt ? new Date(lastContactedAt) : undefined),
      },
    });
    res.json(updatedApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/applications/:id
// @desc    Delete a job application
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await prisma.application.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    // Since we set up `onDelete: Cascade`, this will also delete all related interactions
    await prisma.application.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ msg: 'Application removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;