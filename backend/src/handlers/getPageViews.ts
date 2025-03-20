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
 * Lambda handler to retrieve page views from the last hour.
 * 
 * @description This handler queries DynamoDB for all page view records from the past hour.
 * It aggregates view counts per minute to provide telemetry data for the dashboard.
 * 
 * @returns {Promise<APIGatewayProxyResult>} Returns a promise that resolves to an API Gateway response
 * containing either:
 * - 200: Array of page view records with timestamps and counts
 * - 500: Error message if the database query fails
 */

export const handler: APIGatewayProxyHandler = async () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  const params = {
    TableName: process.env.DYNAMODB_TABLE!,
    KeyConditionExpression: '#timestamp >= :oneHourAgo',
    ExpressionAttributeNames: {
      '#timestamp': 'timestamp'
    },
    ExpressionAttributeValues: {
      ':oneHourAgo': oneHourAgo
    }
  };

  try {
    const result = await dynamoDb.query(params).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    console.error('Error fetching page views:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Could not fetch page views' })
    };
  }
};