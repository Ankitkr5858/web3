import { handler } from '../recordPageView';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const mockDynamoDb = new DynamoDB.DocumentClient();

describe('recordPageView handler', () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const mockContext: Partial<Context> = {};

  const mockCallback = jest.fn();

  beforeEach(() => {
    // Reset mock implementation before each test
    (mockDynamoDb.update as jest.Mock).mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    });
    mockCallback.mockClear();
  });

  it('should record a page view successfully', async () => {
    const response = await handler(
      mockEvent as APIGatewayProxyEvent,
      mockContext as Context,
      mockCallback
    ) as APIGatewayProxyResult;
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Page view recorded'
    });
    expect(mockDynamoDb.update).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    (mockDynamoDb.update as jest.Mock).mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    });

    const response = await handler(
      mockEvent as APIGatewayProxyEvent,
      mockContext as Context,
      mockCallback
    ) as APIGatewayProxyResult;
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Could not record page view'
    });
    expect(mockDynamoDb.update).toHaveBeenCalled();
  });
});