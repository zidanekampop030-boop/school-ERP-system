import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/db';
import { startRabbitMQConsumer } from './config/rabbitmq';
import financeRoutes from './routes/financeRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/finance', financeRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'finance-service' });
});

const startServer = async () => {
  await connectDB();
  
  // Start RabbitMQ subscription asynchronously
  startRabbitMQConsumer();

  try {
    await sequelize.sync({ force: false });
    console.log('Finance database schemas synchronized.');

    app.listen(PORT, () => {
      console.log(`Finance service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error synchronizing finance database schemas:', error);
  }
};

startServer();
