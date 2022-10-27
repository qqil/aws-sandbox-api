import type { AWS } from "@serverless/typescript";

import getProductsById from "@functions/get-products-by-id";
import getProductsList from "@functions/get-products-list";
import createProduct from "@functions/create-product";
import dynamoDbTables from "src/database/dynamodb.tables";

const serverlessConfiguration: AWS = {
  service: "product-service",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    profile: "default",
    region: "eu-central-1",
    stage: "dev",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      TABLE_PRODUCTS: "products",
      TABLE_STOCKS: "stocks",
    },
  },
  functions: {
    getProductsList: {
      ...getProductsList,
      role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
    },
    getProductsById: {
      ...getProductsById,
      role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
    },
    createProduct: {
      ...createProduct,
      role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
    },
  },
  resources: {
    Resources: {
      ...dynamoDbTables,

      LambdaExecutionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "ProductServiceLambdaExecutionRole",
          AssumeRolePolicyDocument: {
            Statement: {
              Effect: "Allow",
              Action: "sts:AssumeRole",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
            },
          },
        },
      },

      DynamoDBAccessPolicy: {
        Type: "AWS::IAM::Policy",
        Properties: {
          PolicyName: "ProductServiceDynamoDBAccessPolicy",
          Roles: [{ Ref: "LambdaExecutionRole" }],
          PolicyDocument: {
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "dynamodb:Query",
                  "dynamodb:Scan",
                  "dynamodb:Get*",
                  "dynamodb:Update*",
                  "dynamodb:PutItem",
                  "dynamodb:Delete*",
                  "dynamodb:BatchGet*",
                  "dynamodb:BatchWrite*",
                ],
                Resource: [
                  { "Fn::GetAtt": ["DynamoDbProductsTable", "Arn"] },
                  { "Fn::GetAtt": ["DynamoDbStocksTable", "Arn"] },
                ],
              },
            ],
          },
        },
      },
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node16",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
