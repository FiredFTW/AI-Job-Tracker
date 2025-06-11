// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js'; 
import tasksRoutes from './routes/tasks.js';
import applicationsRoutes from './routes/applications.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173', 
  'https://life-dash-psi.vercel.app' 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

// Middleware
app.use(cors(corsOptions)); // Allows requests from other origins 
app.use(express.json()); // Allows us to parse JSON in the request body

app.use('/api', apiRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});