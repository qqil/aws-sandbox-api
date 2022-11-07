import type { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csvParser from "csv-parser";
import { Readable, Writable } from "node:stream";
import { basename, join } from "node:path";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

const sendToSQS = new Writable({
  objectMode: true,
  write(chunk, encoding, callback) {
    sqsClient
      .send(
        new SendMessageCommand({
          QueueUrl: process.env.CATALOG_ITEMS_QUEUE,
          MessageBody: JSON.stringify(chunk),
        })
      )
      .then(() => callback())
      .catch(callback);
  },
});

const importFileParser = async (event: S3Event) => {
  for (const file of event.Records) {
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
        .pipe(sendToSQS)
        .on("finish", resolve)
        .on("error", reject);
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
  }
};

export const main = importFileParser;
