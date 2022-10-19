export default {
  DynamoDbProductsTable: {
    Type: "AWS::DynamoDB::Table",
    Properties: {
      TableName: "products",
      BillingMode: "PROVISIONED",
      ProvisionedThroughput: {
        ReadCapacityUnits: 3,
        WriteCapacityUnits: 3,
      },
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    },
  },
  DynamoDbStocksTable: {
    Type: "AWS::DynamoDB::Table",
    Properties: {
      TableName: "stocks",
      BillingMode: "PROVISIONED",
      ProvisionedThroughput: {
        ReadCapacityUnits: 3,
        WriteCapacityUnits: 3,
      },
      AttributeDefinitions: [
        { AttributeName: "product_id", AttributeType: "S" },
      ],
      KeySchema: [{ AttributeName: "product_id", KeyType: "HASH" }],
    },
  },
};
