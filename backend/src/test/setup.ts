import { DynamoDB } from 'aws-sdk';

// Set environment variables for testing
process.env.DYNAMODB_TABLE = 'test-table';
process.env.AWS_REGION = 'us-east-1';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      update: jest.fn(),
      query: jest.fn(),
    }))
  }
}));

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});