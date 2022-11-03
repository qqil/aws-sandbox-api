import type { AWS } from "@serverless/typescript";

import getProductsById from "@functions/get-products-by-id";
import getProductsList from "@functions/get-products-list";
import createProduct from "@functions/create-product";
import dynamoDbTables from "src/database/dynamodb.tables";
import catalogBatchProcess from "@functions/catalog-batch-process";

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
      CATALOG_ITEMS_QUEUE: { Ref: "SQSCatalogItemsQueue" },
      SNS_PRODUCT_CREATED_TOPIC_ARN: { Ref: "SNSProductCreatedTopic" },
    },
  },
  functions: {
    getProductsList,
    getProductsById,
    createProduct,
    catalogBatchProcess,
  },
  resources: {
    Resources: {
      ...dynamoDbTables,

      LambdaExecutionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "ProductServiceLambdaExecutionRole",
          ManagedPolicyArns: [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          ],
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

      SQSCatalogItemsQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          ReceiveMessageWaitTimeSeconds: 20,
          VisibilityTimeout: 30,
        },
      },

      SQSCatalogItemsQueuePolicy: {
        Type: "AWS::IAM::Policy",
        Properties: {
          PolicyName: "ProductServiceSQSCatalogItemsQueuePolicy",
          Roles: [{ Ref: "LambdaExecutionRole" }],
          PolicyDocument: {
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "sqs:ReceiveMessage",
                  "sqs:DeleteMessage",
                  "sqs:GetQueueAttributes",
                ],
                Resource: [{ "Fn::GetAtt": ["SQSCatalogItemsQueue", "Arn"] }],
              },
            ],
          },
        },
      },

      SNSProductCreatedTopic: {
        Type: "AWS::SNS::Topic",
      },

      SNSProductCreatedTopicSubscriptionEmptyStocks: {
        Type: "AWS::SNS::Subscription",
        Properties: {
          TopicArn: { Ref: "SNSProductCreatedTopic" },
          Protocol: "email",
          Endpoint: "s.zakatov@gmail.com",
          FilterPolicy: {
            hasEmptyStocks: ["true"],
          },
        },
      },

      SNSProductCreatedTopicSubscriptionNonEmptyStocks: {
        Type: "AWS::SNS::Subscription",
        Properties: {
          TopicArn: { Ref: "SNSProductCreatedTopic" },
          Protocol: "email",
          Endpoint: "sergejs_zakatovs@epam.com",
          FilterPolicy: {
            hasEmptyStocks: ["false"],
          },
        },
      },

      SNSProductCreatedTopicPolicy: {
        Type: "AWS::IAM::Policy",
        Properties: {
          PolicyName: "ProductServiceSNSProductCreatedTopicPolicy",
          Roles: [{ Ref: "LambdaExecutionRole" }],
          PolicyDocument: {
            Statement: [
              {
                Effect: "Allow",
                Action: ["sns:Publish"],
                Resource: [{ Ref: "SNSProductCreatedTopic" }],
              },
            ],
          },
        },
      },
    },
    Outputs: {
      CatalogItemsQueue: {
        Value: { Ref: "SQSCatalogItemsQueue" },
      },
      CatalogItemsQueueArn: {
        Value: { "Fn::GetAtt": ["SQSCatalogItemsQueue", "Arn"] },
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
