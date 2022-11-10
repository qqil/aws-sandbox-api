import { APIGatewayTokenAuthorizerHandler } from "aws-lambda";

// Dummy credentials validation
const checkCredentials = (username: string, password: string) => {
  if (!password || password == "") return false;

  return process.env[username] === password;
};

const basicAuthorizer: APIGatewayTokenAuthorizerHandler = async (event) => {
  const [authType, token] = event.authorizationToken.split(" ");

  if (authType.toLowerCase() !== "basic")
    throw new Error(`Unknown authorization type "${authType}".`);

  if (token.length === 0) throw new Error(`Empty token.`);

  const [username, password] = Buffer.from(token, "base64")
    .toString("utf8")
    .split(":");

  const isLoggedIn = checkCredentials(username, password);

  return {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: isLoggedIn ? "Allow" : "Deny",
          Resource: event.methodArn,
        },
      ],
    },
  };
};

export const main = basicAuthorizer;
