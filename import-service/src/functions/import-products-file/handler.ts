import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { eventSchema } from "./schema";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { join } from "node:path";
import validator from "@middy/validator";

const s3Client = new S3Client({});

const importProductsFile: ValidatedEventAPIGatewayProxyEvent<
  typeof eventSchema
> = async (event) => {
  const { name } = event.queryStringParameters;
  const nameWithPrefix = `${new Date().getTime()}_${name}`;

  const signedUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: join(process.env.UPLOAD_DIR, nameWithPrefix),
      ContentType: "text/csv",
    }),
    { expiresIn: 300 }
  );

  return formatJSONResponse({ signedUrl });
};

export const main = middyfy(importProductsFile).use(validator({ eventSchema }));
