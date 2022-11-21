import type { AWS } from "@serverless/typescript";
import importProductsFile from "@functions/import-products-file";
import { cors } from "@functions/cors";
import importFileParser from "@functions/import-file-parser";

const serverlessConfiguration: AWS = {
  service: "import-service",
  frameworkVersion: "3",
  configValidationMode: "error",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    profile: "default",
    region: "eu-central-1",
    stage: "dev",
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      BUCKET_NAME: { Ref: "S3UploadBucket" },
      UPLOAD_DIR: "uploaded",
      PARSED_DIR: "parsed",
      CATALOG_ITEMS_QUEUE: "${param:CatalogItemsQueue}",
    },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
  },
  functions: {
    importProductsFile,
    importFileParser,
  },
  resources: {
    Resources: {
      LambdaExecutionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "ImportServiceLambdaExecutionRole",
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

      S3UploadBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["PUT"],
                AllowedOrigins: cors.origins,
              },
            ],
          },
        },
      },

      S3UploadBucketAccessPolicy: {
        Type: "AWS::IAM::Policy",
        Properties: {
          PolicyName: "ImportServiceS3UploadBucketAccessPolicy",
          Roles: [{ Ref: "LambdaExecutionRole" }],
          PolicyDocument: {
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "s3:GetObject",
                  "s3:PutObject",
                  "s3:DeleteObject",
                  "s3:CopyObject",
                  "s3:GetObjectTagging",
                  "s3:PutObjectTagging",
                ],
                Resource: [
                  {
                    "Fn::Join": [
                      "",
                      [{ "Fn::GetAtt": ["S3UploadBucket", "Arn"] }, "/*"],
                    ],
                  },
                ],
              },
            ],
          },
        },
      },

      SQSCatalogItemsQueuePolicy: {
        Type: "AWS::IAM::Policy",
        Properties: {
          PolicyName: "ImportServiceSQSCatalogItemsQueuePolicy",
          Roles: [{ Ref: "LambdaExecutionRole" }],
          PolicyDocument: {
            Statement: [
              {
                Effect: "Allow",
                Action: ["sqs:SendMessage"],
                Resource: ["${param:CatalogItemsQueueArn}"],
              },
            ],
          },
        },
      },

      BasicAuthorizer: {
        Type: "AWS::ApiGateway::Authorizer",
        Properties: {
          Name: "BasicAuthorizer",
          Type: "TOKEN",
          AuthorizerUri: "${param:BasicAuthorizerLambdaArn}",
          IdentitySource: "method.request.header.Authorization",
          IdentityValidationExpression: "Basic (.*)",
          RestApiId: { Ref: "ApiGatewayRestApi" },
        },
      },

      GatewayResponse4xx: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
          },
          ResponseType: "DEFAULT_4XX",
          RestApiId: { Ref: "ApiGatewayRestApi" },
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
