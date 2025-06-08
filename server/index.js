// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js'; 
import tasksRoutes from './routes/tasks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows requests from other origins 
app.use(express.json()); // Allows us to parse JSON in the request body

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});