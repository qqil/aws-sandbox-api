import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      s3: {
        bucket: { Ref: "S3ImageBucket" },
        existing: true,
        event: "s3:ObjectCreated:*",
        rules: [
          { prefix: "${self:provider.environment.UPLOAD_DIR}" },
          { suffix: ".csv" },
        ],
      },
    },
  ],
};
