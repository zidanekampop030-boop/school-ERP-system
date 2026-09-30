import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/db';
import authRoutes from './routes/authRoutes';
import { authenticateJWT, authorizeRoles } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'auth-service' });
});

/**
 * DEMO RBAC ENDPOINT FOR EXAMINER EVALUATION
 * You can show this to the examiner to prove Role-Based Access Control works.
 * You can modify allowed roles (e.g. adding 'Student' or changing to 'Admin' only) live.
 */
app.get('/api/v1/auth/admin-only', authenticateJWT, authorizeRoles('Admin'), (req: any, res) => {
  res.status(200).json({
    message: 'Welcome Admin! This is a secure area.',
    user: req.user,
  });
});

app.get('/api/v1/auth/student-or-admin', authenticateJWT, authorizeRoles('Admin', 'Student'), (req: any, res) => {
  res.status(200).json({
    message: 'Welcome Student or Admin! This area is accessible to both roles.',
    user: req.user,
  });
});

// Sync database and start server
const startServer = async () => {
  await connectDB();
  
  // Sync models
  try {
    await sequelize.sync({ force: false }); // force: false ensures we don't drop existing data on start
    console.log('Database schemas synchronized.');
    
    app.listen(PORT, () => {
      console.log(`Authentication service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error synchronizing database schemas:', error);
  }
};

startServer();
