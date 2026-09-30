import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'student_enrollment';

let channel: amqp.Channel | null = null;
let connection: amqp.Connection | null = null;

export const connectRabbitMQ = async () => {
  let retries = 5;
  while (retries) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      console.log('Connected to RabbitMQ successfully.');
      
      connection.on('close', () => {
        console.error('RabbitMQ connection closed. Reconnecting...');
        channel = null;
        setTimeout(connectRabbitMQ, 5000);
      });
      break;
    } catch (error) {
      console.error(`RabbitMQ connection failed. Retries remaining: ${retries - 1}. Error:`, error);
      retries -= 1;
      // Wait 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export const publishEnrollmentEvent = async (data: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseCode: string;
  courseTitle: string;
  amount: number;
}) => {
  if (!channel) {
    console.error('RabbitMQ channel is not available. Cannot publish event.');
    return false;
  }

  try {
    const message = JSON.stringify(data);
    channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
    console.log(`Published enrollment event to RabbitMQ: student_id=${data.studentId}, course=${data.courseCode}`);
    return true;
  } catch (error) {
    console.error('Error publishing message to RabbitMQ:', error);
    return false;
  }
};
