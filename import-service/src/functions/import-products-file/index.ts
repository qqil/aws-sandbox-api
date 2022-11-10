import { handlerPath } from "@libs/handler-resolver";
import { cors } from "@functions/cors";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "GET",
        path: "/import",
        cors,
        request: {
          parameters: {
            querystrings: {
              name: true,
            },
          },
        },
        authorizer: {
          type: "TOKEN",
          authorizerId: { Ref: "BasicAuthorizer" },
        },
      },
    },
  ],
  role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
};
