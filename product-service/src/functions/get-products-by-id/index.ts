import { handlerPath } from "@libs/handler-resolver";
import { cors } from "@functions/cors";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "GET",
        path: "/products/{productId}",
        cors,
        request: {
          parameters: {
            paths: {
              productId: true,
            },
          },
        },
      },
    },
  ],
  role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
};
