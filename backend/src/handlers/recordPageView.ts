import { DynamoDB } from 'aws-sdk';
import type { APIGatewayProxyHandler } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION
});

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