import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { dynamoDBDocumentClient } from "@libs/dynamodb-client";
import { ProductService } from "@services/product.service";
import type { SQSEvent } from "aws-lambda";
import { CreateProduct, createProductSchema } from "src/schemas/create-product";
import { Product } from "src/schemas/product";

const productService = new ProductService(dynamoDBDocumentClient, {
  productsTable: process.env.TABLE_PRODUCTS,
  stocksTable: process.env.TABLE_STOCKS,
});

const snsClient = new SNSClient({});

const catalogBatchProcess = async (event: SQSEvent) => {
  console.log(`Processing batch with ${event.Records.length} product(s).`);

  const productsData: CreateProduct[] = await Promise.all(
    event.Records.map(({ body: productData }) =>
      createProductSchema.validate(productData)
    )
  );

  const products: Product[] = await productService.putBatch(productsData);
  const hasEmptyStocks = !!products.find(({ stocks }) => stocks === 0);

  await snsClient.send(
    new PublishCommand({
      TopicArn: process.env.SNS_PRODUCT_CREATED_TOPIC_ARN,
      Subject: `ImportService: products batch processed.`,
      Message: JSON.stringify(products),
      MessageAttributes: {
        hasEmptyStocks: {
          DataType: "String",
          StringValue: hasEmptyStocks.toString(),
        },
      },
    })
  );
};

export const main = catalogBatchProcess;
