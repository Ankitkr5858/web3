import { DynamoDB } from 'aws-sdk';
import type { APIGatewayProxyHandler } from 'aws-lambda';

const dynamoDb = process.env.NODE_ENV === 'test' ? require('../test/setup').mockDynamoDb : new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION
});

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