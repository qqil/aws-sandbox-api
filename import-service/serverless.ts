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
      BUCKET_NAME: { Ref: "S3ImageBucket" },
      UPLOAD_DIR: "uploaded",
      PARSED_DIR: "parsed",
    },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
  },
  functions: {
    importProductsFile: {
      ...importProductsFile,
      role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
    },
    importFileParser: {
      ...importFileParser,
      role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
    },
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

      S3ImageBucket: {
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

      S3ImageBucketAccessPolicy: {
        Type: "AWS::IAM::Policy",
        Properties: {
          PolicyName: "ImportServiceS3ImageBucketAccessPolicy",
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
                      [{ "Fn::GetAtt": ["S3ImageBucket", "Arn"] }, "/*"],
                    ],
                  },
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
