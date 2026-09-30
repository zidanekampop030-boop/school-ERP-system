import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';
import academicRoutes from './routes/academicRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/academic', academicRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'academic-service' });
});

const startServer = async () => {
  await connectDB();
  
  // Connect to RabbitMQ asynchronously so app doesn't crash if broker boots slowly
  connectRabbitMQ();

  try {
    await sequelize.sync({ force: false });
    console.log('Academic database schemas synchronized.');

    app.listen(PORT, () => {
      console.log(`Academic service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error synchronizing academic database schemas:', error);
  }
};

startServer();
