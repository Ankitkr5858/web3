import { handler } from '../recordPageView';
import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      promise: jest.fn().mockResolvedValue({})
    }))
  }
}));

describe('recordPageView handler', () => {
  let event: APIGatewayProxyEvent;
  let context: Context;

  beforeEach(() => {
    event = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    } as any;
    context = {} as Context;
  });

  it('should record a page view successfully', async () => {
    const response = await handler(event, context, () => {});
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Page view recorded'
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('DynamoDB error');
    jest.spyOn(DynamoDB.DocumentClient.prototype, 'update')
      .mockImplementationOnce(() => {
        throw mockError;
      });

    const response = await handler(event, context, () => {});
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Could not record page view'
    });
  });
});