import { DynamoDB } from 'aws-sdk';
import type { APIGatewayProxyHandler } from 'aws-lambda';

/**
 * DynamoDB client instance for database operations.
 * Uses mock client for testing environment and real client for production.
 */
const dynamoDb = process.env.NODE_ENV === 'test' ? require('../test/setup').mockDynamoDb : new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION
});

/**
 * Lambda handler to record a page view in DynamoDB.
 * 
 * @description This handler increments a counter in DynamoDB for the current minute.
 * It uses atomic updates to ensure accurate counting even with concurrent requests.
 * The timestamp is rounded to the nearest minute to aggregate views.
 * 
 * @returns {Promise<APIGatewayProxyResult>} Returns a promise that resolves to an API Gateway response
 * containing either:
 * - 200: Success message indicating the view was recorded
 * - 500: Error message if the database update fails
 */

export const handler: APIGatewayProxyHandler = async () => {
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

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: 'Page view recorded' })
    };
  } catch (error) {
    console.error('Error recording page view:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Could not record page view' })
    };
  }
};