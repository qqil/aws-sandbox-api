import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({});

const documentClientParams = {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
};

const dynamoDBDocumentClient = DynamoDBDocumentClient.from(
  dynamoDBClient,
  documentClientParams
);

export { dynamoDBDocumentClient, dynamoDBClient };
