import { handler } from '../recordPageView';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

describe('recordPageView handler', () => {
  let event: Partial<APIGatewayProxyEvent>;
  let context: Partial<Context>;
  let mockDynamoDb: jest.Mocked<DynamoDB.DocumentClient>;

  beforeEach(() => {
    event = {
      httpMethod: 'POST',
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

  it('should record a page view successfully', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    });

    mockDynamoDb.update = mockUpdate;

    const response = await handler(event as APIGatewayProxyEvent, context as Context);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Page view recorded'
    });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    });

    mockDynamoDb.update = mockUpdate;

    const response = await handler(event as APIGatewayProxyEvent, context as Context);
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Could not record page view'
    });
    expect(mockUpdate).toHaveBeenCalled();
  });
});