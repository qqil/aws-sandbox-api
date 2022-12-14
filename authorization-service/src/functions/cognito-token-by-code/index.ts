import { handlerPath } from "@libs/handler-resolver";
import { cors } from "@functions/cors";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "POST",
        path: "/cognito/token",
        cors,
      },
    },
  ],
  role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
};
