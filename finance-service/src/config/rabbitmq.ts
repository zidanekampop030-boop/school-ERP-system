import amqp from 'amqplib';
import dotenv from 'dotenv';
import { Invoice } from '../models/Invoice';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'student_enrollment';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export const startRabbitMQConsumer = async () => {
  let retries = 5;
  while (retries) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      
      console.log('Finance service RabbitMQ consumer initialized. Waiting for messages...');

      channel.consume(QUEUE_NAME, async (msg) => {
        if (msg !== null) {
          try {
            const content = msg.content.toString();
            const data = JSON.parse(content);
            console.log('Received enrollment message from RabbitMQ:', data);

            const { studentId, studentName, studentEmail, courseCode, amount } = data;

            // Generate invoice due in 30 days
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            const invoice = await Invoice.create({
              studentId,
              studentName,
              studentEmail,
              courseCode,
              amount,
              status: 'PENDING',
              dueDate,
            });

            console.log(`Successfully generated PENDING invoice ${invoice.id} for student ${studentName} (amount: $${amount})`);
            
            // Acknowledge message
            channel?.ack(msg);
          } catch (error) {
            console.error('Error processing RabbitMQ message:', error);
            // Requeue message if error is temporary, or reject
            channel?.nack(msg, false, true);
          }
        }
      });

      connection.on('close', () => {
        console.error('RabbitMQ consumer connection closed. Reconnecting...');
        channel = null;
        setTimeout(startRabbitMQConsumer, 5000);
      });
      break;
    } catch (error) {
      console.error(`RabbitMQ consumer connection failed. Retries remaining: ${retries - 1}. Error:`, error);
      retries -= 1;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
