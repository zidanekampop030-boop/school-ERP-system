import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/db';
import hrRoutes from './routes/hrRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/hr', hrRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'hr-service' });
});

const startServer = async () => {
  await connectDB();

  try {
    await sequelize.sync({ force: false });
    console.log('HR database schemas synchronized.');

    app.listen(PORT, () => {
      console.log(`HR service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error synchronizing HR database schemas:', error);
  }
};

startServer();
