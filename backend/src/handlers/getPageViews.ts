import { DynamoDB } from 'aws-sdk';
import type { APIGatewayProxyHandler } from 'aws-lambda';

/**
 * Interface for a page view record stored in DynamoDB.
 */
interface PageView {
  count?: { N: string };
  timestamp?: { N: string };
}

/**
 * DynamoDB client instance for database operations.
 * Uses a mock client for testing and a real client for production.
 */
const dynamoDb = process.env.NODE_ENV === 'test' 
  ? require('../test/setup').mockDynamoDb 
  : new DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

/**
 * Lambda handler to retrieve page views from the last hour.
 * 
 * @returns {Promise<APIGatewayProxyResult>} API response with page view data.
 */
export const handler: APIGatewayProxyHandler = async () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000; // 1 hour ago

  if (!process.env.DYNAMODB_TABLE) {
    console.error("DYNAMODB_TABLE environment variable is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    
    console.log("Raw DynamoDB Response:", JSON.stringify(result, null, 2));

    // Ensure timestamps are numbers and filter out older records
    const filteredItems = (result.Items as PageView[])?.filter((item) => {
      if (!item.timestamp?.N) return false; // Ensure timestamp exists
      const timestamp = Number(item.timestamp.N); // Convert from DynamoDB's format
      return timestamp >= oneHourAgo;
    }) || [];

    console.log("Filtered Items:", JSON.stringify(filteredItems, null, 2));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(result.Items ?? [])
    };
    

  } catch (error) {
    console.error("Error fetching page views:", error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: "Could not fetch page views" }),
    };
  }
};
