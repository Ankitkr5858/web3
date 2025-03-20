import express from 'express';
import cors from 'cors';
import { DynamoDB } from 'aws-sdk';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const app = express();
const port = process.env.PORT || 3000;

// DynamoDB client configuration
const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Record page view endpoint
app.post('/telemetry/pageview', async (_req: express.Request, res: express.Response) => {
  const timestamp = Math.floor(Date.now() / 60000) * 60000; // Round to nearest minute

  const params = {
    TableName: process.env.DYNAMODB_TABLE!,
    Key: { timestamp },
    UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :inc',
    ExpressionAttributeNames: {
      '#count': 'count'
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':zero': 0
    },
    ReturnValues: 'NONE'
  };

  try {
    await dynamoDb.update(params).promise();
    res.status(200).json({ message: 'Page view recorded successfully' });
  } catch (error) {
    logger.error('Error recording page view:', error);
    res.status(500).json({ error: 'Could not record page view' });
  }
});

// Get page views endpoint
app.get('/telemetry/pageviews', async (_req: express.Request, res: express.Response) => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  const params = {
    TableName: process.env.DYNAMODB_TABLE!,
    ScanIndexForward: false,
    Limit: 60
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    const filteredItems = result.Items?.filter(item => item.timestamp >= oneHourAgo) || [];
    console.log(filteredItems, 'hello', result);
    res.status(200).json(filteredItems);
  } catch (error) {
    logger.error('Error fetching page views:', error);
    res.status(500).json({ error: 'Could not fetch page views' });
  }
});

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});