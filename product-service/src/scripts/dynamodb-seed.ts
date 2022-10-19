import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import * as serverlessConfig from "../../serverless";
import { faker } from "@faker-js/faker";
import { Product } from "src/types/product";
import { v4 } from "uuid";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const { profile = "default", region = "eu-west-1" } =
  serverlessConfig["default"]["provider"];

const client = new DynamoDBClient({
  region,
  credentials: fromIni({ profile }),
});

const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: false,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

const generateProducts = (amount: number): Product[] => {
  const products: Product[] = [];

  for (let i = 0; i < amount; i++) {
    products.push({
      id: v4(),
      title: faker.commerce.productName(),
      description: faker.lorem.paragraph(5),
      price: faker.datatype.number({ min: 0, max: 1000, precision: 0.01 }),
      stocks: faker.datatype.number({ min: 0, max: 100, precision: 1 }),
    });
  }

  return products;
};

const splitIntoBatches = (requests, batchSize = 25) => {
  if (requests.length <= batchSize) return [requests];

  const totalBatches = Math.ceil(requests.length / batchSize);
  const batches = [];

  for (let i = 0; i < totalBatches; i++) {
    const startIndex = i * batchSize;
    const endIndex = startIndex + batchSize;

    batches.push(requests.slice(startIndex, endIndex));
  }

  return batches;
};

const writeBatch = async (table, requests) => {
  const batches = splitIntoBatches(requests);

  for (let i = 0; i < batches.length; i++) {
    try {
      const response = await documentClient.send(
        new BatchWriteCommand({ RequestItems: { [table]: batches[i] } })
      );

      if (response.$metadata.httpStatusCode === 200) {
        console.log(`Table "${table}" batch ${i} is sent successfully.`);
      } else {
        console.log(`Table "${table}" batch ${i} error.`, response);
      }
    } catch (e) {
      console.log(`Table "${table}" batch ${i} error.`, e);
    }
  }
};

// Main
(async () => {
  const products = generateProducts(30);

  const productRequests = products.map(({ id, title, description, price }) => ({
    PutRequest: {
      Item: { id, title, description, price },
    },
  }));

  const stockRequests = products.map(({ id: product_id, stocks }) => ({
    PutRequest: {
      Item: { product_id, stocks },
    },
  }));

  await writeBatch("products", productRequests);
  await writeBatch("stocks", stockRequests);
})();
