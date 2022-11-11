import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sqs: {
        batchSize: 5,
        maximumBatchingWindow: 60,
        arn: {
          "Fn::GetAtt": ["SQSCatalogItemsQueue", "Arn"],
        },
      },
    },
  ],
  role: { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
};
