import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import auth from '../middleware/auth.js';
import { google } from 'googleapis';
import axios from 'axios'; // For Hugging Face
import { VertexAI } from '@google-cloud/vertexai';

const prisma = new PrismaClient();
const router = express.Router();

const getCompanyKey = (companyName) => {
  if (!companyName) return null;
  // Get the first word, remove punctuation, and make it lowercase.
  return companyName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

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
  // Destructure all relevant fields from the request body
  const { company, role, status, nextStep, appliedAt, lastContactedAt } = req.body;

  if (!company || !role) {
    return res.status(400).json({ msg: 'Company and role are required' });
  }

  try {
    const newApplication = await prisma.application.create({
      data: {
        company,
        role,
        status, // Add status
        nextStep, // Add nextStep
        // Convert date strings to Date objects, or handle nulls
        appliedAt: appliedAt ? new Date(appliedAt) : null,
        lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : null,
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
      // Ensure we return the application with its interactions
      include: { interactions: true },
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
      q: `(subject:("interview" OR "application" OR "assessment" OR "applying") OR "your application for" OR "thank you for applying") newer_than:5d`,
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


      // === Part 4: The AI Interpretation (Google Gemini Pro) ===

      // Initialize Vertex AI. It will automatically use the credentials
      const vertex_ai = new VertexAI({ project: process.env.GOOGLE_PROJECT_ID, location: 'us-central1' });
      // Corrected model name from your previous feedback.
      const model = 'gemini-2.0-flash'; 

      const generativeModel = vertex_ai.getGenerativeModel({ model: model });

      // The prompt is a simple, direct instruction.
      const prompt = `
      Task: You are an expert assistant for a job applicant. Analyze the following email and extract structured information into a single, valid JSON object.

      Context:
      - Email Subject: "${subject}"
      - Email Body (first 1500 characters): "${emailBody.substring(0, 1500)}"

      Instructions for the JSON object:
      - "companyName": The name of the company.
      - "role": The job role mentioned. If none is found, use the value "Unknown Role".
      - "status": Classify as one of: 'ACTIVE', 'OFFER', 'REJECTED'.
      - "nextStep": A very brief action item for the user. Examples: "Pending response", "Complete assessment", "Interview on DATE", "Reply to schedule".
      - "summary": A one-sentence summary of the email's purpose.

      Respond with ONLY the JSON object.
      `;

      const request = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const resp = await generativeModel.generateContent(request);

      // Defensively access the AI's response to prevent crashes
      const candidate = resp.response?.candidates?.[0];
      const jsonString = candidate?.content?.parts?.[0]?.text;

      // --- THE FIX IS HERE ---
      // If we didn't get a valid string from the AI, log the problem and skip to the next email.
      if (!jsonString) {
        console.error('Invalid or empty AI response received for email with subject:', subject);
        // Optional: Log the full response to see what Google sent back
        // console.error('Full AI Response:', JSON.stringify(resp.response, null, 2));
        continue; // Exit the current loop iteration
      }

      // Now we can safely proceed, knowing jsonString is a real string.
      const cleanedJsonString = jsonString.replace(/```json\n|```/g, '').trim();
      const aiResult = JSON.parse(cleanedJsonString);

      // === Part 5: Find or Create Application & Update Database ===
      const aiCompanyKey = getCompanyKey(aiResult.companyName);

      // Find a matching application by comparing keys.
      // We search through the `user.Application` array we fetched at the beginning.
      let application = null;
      if (aiCompanyKey) {
        application = user.Application.find(app => getCompanyKey(app.company) === aiCompanyKey);
      }

      // If application doesn't exist after checking keys, create it.
      if (!application) {
        application = await prisma.application.create({
          data: {
            userId: user.id,
            company: aiResult.companyName, // Use the more descriptive name from the latest email
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