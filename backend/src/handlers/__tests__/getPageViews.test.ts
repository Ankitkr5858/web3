import { handler } from '../getPageViews';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

describe('getPageViews handler', () => {
  let event: Partial<APIGatewayProxyEvent>;
  let context: Partial<Context>;
  let mockDynamoDb: jest.Mocked<DynamoDB.DocumentClient>;

  beforeEach(() => {
    event = {
      httpMethod: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    context = {};

    // Create a new mock instance for each test
    mockDynamoDb = new DynamoDB.DocumentClient() as jest.Mocked<DynamoDB.DocumentClient>;
    (DynamoDB.DocumentClient as jest.Mock).mockImplementation(() => mockDynamoDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return page views successfully', async () => {
    const mockItems = [{ timestamp: Date.now(), count: 1 }];
    
    const mockQuery = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Items: mockItems })
    });

    mockDynamoDb.query = mockQuery;

    const response = await handler(event as APIGatewayProxyEvent, context as Context);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockItems);
    expect(mockQuery).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockQuery = jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    });

    mockDynamoDb.query = mockQuery;

    const response = await handler(event as APIGatewayProxyEvent, context as Context);
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Could not fetch page views'
    });
    expect(mockQuery).toHaveBeenCalled();
  });
});