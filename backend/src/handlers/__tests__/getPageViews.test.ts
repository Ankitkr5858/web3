import { handler } from '../getPageViews';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const mockDynamoDb = new DynamoDB.DocumentClient();

describe('getPageViews handler', () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const mockContext: Partial<Context> = {};

  const mockCallback = jest.fn();

  beforeEach(() => {
    // Reset mock implementation before each test
    (mockDynamoDb.query as jest.Mock).mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Items: [] })
    });
    mockCallback.mockClear();
  });

  it('should return page views successfully', async () => {
    const mockItems = [{ timestamp: Date.now(), count: 1 }];
    
    (mockDynamoDb.query as jest.Mock).mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Items: mockItems })
    });

    const response = await handler(
      mockEvent as APIGatewayProxyEvent,
      mockContext as Context,
      mockCallback
    ) as APIGatewayProxyResult;
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockItems);
    expect(mockDynamoDb.query).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    (mockDynamoDb.query as jest.Mock).mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    });

    const response = await handler(
      mockEvent as APIGatewayProxyEvent,
      mockContext as Context,
      mockCallback
    ) as APIGatewayProxyResult;
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Could not fetch page views'
    });
    expect(mockDynamoDb.query).toHaveBeenCalled();
  });
});