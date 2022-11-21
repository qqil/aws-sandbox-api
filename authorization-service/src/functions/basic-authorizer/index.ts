import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
};
