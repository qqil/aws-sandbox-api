import type { AWS } from "@serverless/typescript";
import basicAuthorizer from "@functions/basic-authorizer";

const serverlessConfiguration: AWS = {
  service: "authorization-service",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild", "serverless-dotenv-plugin"],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    profile: "default",
    region: "eu-central-1",
    stage: "dev",
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
  },
  functions: {
    basicAuthorizer,
  },
  package: { individually: true },
  resources: {
    Resources: {
      LambdaExecutionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "AuthorizationServiceLambdaExecutionRole",
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

      InvokeLambdaPermission: {
        Type: "AWS::Lambda::Permission",
        Properties: {
          FunctionName: {
            "Fn::GetAtt": ["BasicAuthorizerLambdaFunction", "Arn"],
          },
          Action: "lambda:InvokeFunction",
          Principal: "apigateway.amazonaws.com",
          SourceAccount: {
            Ref: "AWS::AccountId",
          },
        },
      },
    },
    Outputs: {
      BasicAuthorizerLambdaArn: {
        Value: {
          "Fn::Join": [
            "",
            [
              "arn:aws:apigateway:",
              {
                Ref: "AWS::Region",
              },
              ":lambda:path/2015-03-31/functions/",
              {
                "Fn::GetAtt": ["BasicAuthorizerLambdaFunction", "Arn"],
              },
              "/invocations",
            ],
          ],
        },
      },
    },
  },
  custom: {
    dotenv: {
      required: {
        file: true,
      },
    },
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
