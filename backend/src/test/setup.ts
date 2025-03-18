// Set environment variables for testing
process.env.DYNAMODB_TABLE = 'test-table';
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

// Create mock DynamoDB client
const mockDynamoDb = {
  update: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({})
  }),
  query: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({ Items: [] })
  })
};

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => mockDynamoDb)
  }
}));

// Export mock for handlers
export { mockDynamoDb };

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test teardown
afterEach(() => {
  jest.clearAllMocks();
});