import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import { google } from 'googleapis';
import axios from 'axios'; // For Hugging Face

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

// @route   POST /api/applications/sync
// @desc    Intelligently sync job application emails from Gmail
// @access  Private
router.post('/sync', auth, async (req, res) => {
  try {
    // === Part 1: Setup and Fetch User's Data ===
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      // Fetch existing applications AND their interactions to prevent duplicates
      include: {
        Application: {
          include: { interactions: true },
        },
      },
    });

    if (!user || !user.googleRefreshToken) {
      return res.status(400).json({ msg: 'Google account not connected.' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // === Part 2: Fetch Recent Emails from Gmail ===
    const listMessagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: `(subject:("interview" OR "application" OR "assessment") OR "your application for" OR "thank you for applying") newer_than:5d`,
    });

    if (!listMessagesResponse.data.messages) {
      return res.json({ msg: 'No new job application emails found.' });
    }

    // === Part 3: Loop Through Each Email and Process Intelligently ===
    let updatesMade = 0;
    for (const messageHeader of listMessagesResponse.data.messages) {
      const message = await gmail.users.messages.get({ userId: 'me', id: messageHeader.id, format: 'full' });
      
      const subject = message.data.payload.headers.find(h => h.name === 'Subject')?.value;
      const date = new Date(parseInt(message.data.internalDate));

      // --- CHECK FOR DUPLICATES ---
      // Check if any interaction for this user already has this exact subject and date
      const alreadyProcessed = user.Application.some(app =>
        app.interactions.some(
          inter => inter.subject === subject && new Date(inter.date).getTime() === date.getTime()
        )
      );
      if (alreadyProcessed) {
        continue; // Skip this email, we've already seen it.
      }

      // --- DECODE EMAIL BODY ---
      let emailBody;
      if (message.data.payload.parts?.find(p => p.mimeType === 'text/plain')?.body.data) {
        emailBody = Buffer.from(message.data.payload.parts.find(p => p.mimeType === 'text/plain').body.data, 'base64').toString('utf8');
      } else if (message.data.payload.body?.data) {
        emailBody = Buffer.from(message.data.payload.body.data, 'base64').toString('utf8');
      }
      if (!emailBody) continue; // Skip if no body


      // === Part 4: The AI Interpretation (Hugging Face) ===
      const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";
      const prompt = `
        [INST] You are a job application assistant. Analyze the email below.
        Subject: "${subject}"
        Body: "${emailBody.substring(0, 1500)}"
        Respond ONLY with a valid JSON object with this exact schema: {"companyName": "string", "role": "string", "status": "string", "nextStep": "string", "summary": "string"}
        - companyName: The name of the company.
        - role: The job role mentioned. If none, use "Unknown Role".
        - status: Classify as ONLY one of: 'ACTIVE', 'OFFER', 'REJECTED'.
        - nextStep: A very brief action item for the user. Examples: "Pending response", "Complete assessment", "Interview on DATE", "Reply to schedule".
        - summary: A one-sentence summary of the email's purpose.
        [/INST]
      `;

      const hfResponse = await axios.post(HUGGING_FACE_API_URL, { inputs: prompt }, { headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}` }});
      const generatedText = hfResponse.data[0].generated_text;
      const jsonString = generatedText.substring(prompt.length).trim();
      const aiResult = JSON.parse(jsonString);

      // === Part 5: Find or Create Application & Update Database ===
      let application = await prisma.application.findFirst({
        where: { userId: user.id, company: { contains: aiResult.companyName, mode: 'insensitive' } },
      });

      // If application doesn't exist, create it.
      if (!application) {
        application = await prisma.application.create({
          data: {
            userId: user.id,
            company: aiResult.companyName,
            role: aiResult.role,
            status: aiResult.status,
            nextStep: aiResult.nextStep,
            appliedAt: date,
            lastContactedAt: date,
          },
        });
      } else {
        // If it exists, update it with the new info.
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: aiResult.status,
            nextStep: aiResult.nextStep,
            lastContactedAt: date,
          },
        });
      }

      // Finally, create the new interaction record.
      await prisma.interaction.create({
        data: {
          applicationId: application.id,
          date,
          subject,
          summary: aiResult.summary,
          type: aiResult.status, // We can reuse the status as the interaction type
        },
      });
      
      updatesMade++;
    } // End of for...loop

    res.json({ msg: `Sync complete. ${updatesMade} new interactions processed.` });

  } catch (err) {
    console.error('Error during sync:', err.response?.data || err.message || err);
    res.status(500).send('Server Error');
  }
});

export default router;