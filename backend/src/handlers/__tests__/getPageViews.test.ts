import { handler } from '../getPageViews';
import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      query: jest.fn().mockReturnThis(),
      promise: jest.fn().mockResolvedValue({
        Items: [
          { timestamp: 1234567890, count: 5 },
          { timestamp: 1234567891, count: 3 }
        ]
      })
    }))
  }
}));

describe('getPageViews handler', () => {
  let event: APIGatewayProxyEvent;
  let context: Context;

  beforeEach(() => {
    event = {
      httpMethod: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    } as any;
    context = {} as Context;
  });

  it('should return page views successfully', async () => {
    const response = await handler(event, context, () => {});
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { timestamp: 1234567890, count: 5 },
      { timestamp: 1234567891, count: 3 }
    ]);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('DynamoDB error');
    jest.spyOn(DynamoDB.DocumentClient.prototype, 'query')
      .mockImplementationOnce(() => {
        throw mockError;
      });

    const response = await handler(event, context, () => {});
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Could not fetch page views'
    });
  });
});