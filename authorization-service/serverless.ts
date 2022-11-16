import type { AWS } from "@serverless/typescript";
import basicAuthorizer from "@functions/basic-authorizer";
import cognitoTokenByCode from "@functions/cognito-token-by-code";

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
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
  },
  functions: {
    basicAuthorizer,
    cognitoTokenByCode,
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

      MyCloudStoreCustomersUserPool: {
        Type: "AWS::Cognito::UserPool",
        Properties: {
          UserPoolName: "MyCloudStoreCustomers",
          AccountRecoverySetting: {
            RecoveryMechanisms: [
              {
                Name: "verified_email",
                Priority: 1,
              },
            ],
          },
          AutoVerifiedAttributes: ["email"],
          MfaConfiguration: "OFF",
          UsernameAttributes: ["email"],
          UsernameConfiguration: {
            CaseSensitive: false,
          },
          EmailConfiguration: {
            EmailSendingAccount: "COGNITO_DEFAULT",
          },
          EmailVerificationMessage: "Code: {####}.",
          EmailVerificationSubject: "Verification",
        },
      },

      MyCloudStoreCustomersUserPoolClient: {
        Type: "AWS::Cognito::UserPoolClient",
        Properties: {
          UserPoolId: { Ref: "MyCloudStoreCustomersUserPool" },
          GenerateSecret: true,
          CallbackURLs: [
            "http://localhost:5173/auth/callback/cognito",
            "http://localhost:4173/auth/callback/cognito",
            "https://dhnwi3uoh4ikp.cloudfront.net/auth/callback/cognito",
          ],
          AllowedOAuthFlows: ["code"],
          AllowedOAuthScopes: ["email", "openid"],
          AllowedOAuthFlowsUserPoolClient: true,
          SupportedIdentityProviders: ["COGNITO"],
          PreventUserExistenceErrors: "ENABLED",
        },
      },

      MyCloudStoreCustomersUserPoolDomain: {
        Type: "AWS::Cognito::UserPoolDomain",
        Properties: {
          Domain: "mycloudstore",
          UserPoolId: { Ref: "MyCloudStoreCustomersUserPool" },
        },
      },
    },
    Outputs: {
      MyCloudStoreCustomersUserPoolId: {
        Value: { Ref: "MyCloudStoreCustomersUserPool" },
      },
      MyCloudStoreCustomersUserPoolClientId: {
        Value: { Ref: "MyCloudStoreCustomersUserPoolClient" },
      },
      MyCloudStoreCustomersUserPoolArn: {
        Value: { "Fn::GetAtt": ["MyCloudStoreCustomersUserPool", "Arn"] },
      },
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
