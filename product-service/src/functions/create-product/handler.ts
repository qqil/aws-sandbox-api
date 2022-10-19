import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { dynamoDBDocumentClient } from "@libs/dynamodb-client";
import { middyfy } from "@libs/lambda";
import validator from "@middy/validator";
import { ProductService } from "@services/product.service";

const productService = new ProductService(dynamoDBDocumentClient, {
  productsTable: process.env.TABLE_PRODUCTS,
  stocksTable: process.env.TABLE_STOCKS,
});

const eventSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["title", "price", "stocks"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        stocks: { type: "number" },
      },
    },
  },
};

const createProduct: ValidatedEventAPIGatewayProxyEvent<
  typeof eventSchema
> = async (event) => {
  const { title, description, price, stocks } = event.body;

  const product = await productService.store({
    title,
    description,
    price,
    stocks,
  });

  return formatJSONResponse({ product });
};

export const main = middyfy(createProduct).use(validator({ eventSchema }));
