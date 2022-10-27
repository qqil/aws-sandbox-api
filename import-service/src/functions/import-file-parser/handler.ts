import type { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csvParser from "csv-parser";
import { Readable } from "node:stream";
import { basename, join } from "node:path";

const s3Client = new S3Client({});

const importFileParser = async (event: S3Event) => {
  const file = event.Records[0];

  const getObjectResponse = await s3Client.send(
    new GetObjectCommand({
      Bucket: file.s3.bucket.name,
      Key: file.s3.object.key,
    })
  );

  await new Promise((resolve, reject) => {
    Readable.from(getObjectResponse.Body)
      .pipe(
        csvParser({
          headers: ["title", "description", "stocks", "price"],
          skipLines: 1,
        })
      )
      .on("data", (data) => console.log("Reading product", data))
      .on("error", reject)
      .on("end", resolve);
  });

  await s3Client.send(
    new CopyObjectCommand({
      Bucket: file.s3.bucket.name,
      Key: join(process.env.PARSED_DIR, basename(file.s3.object.key)),
      CopySource: join(file.s3.bucket.name, file.s3.object.key),
    })
  );

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: file.s3.bucket.name,
      Key: file.s3.object.key,
    })
  );
};

export const main = importFileParser;
