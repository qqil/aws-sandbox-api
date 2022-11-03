import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { dynamoDBDocumentClient } from "@libs/dynamodb-client";
import { middyfy } from "@libs/lambda";
import validator from "@middy/validator";
import { ProductService } from "@services/product.service";
import { eventSchema } from "./schema";

const productService = new ProductService(dynamoDBDocumentClient, {
  productsTable: process.env.TABLE_PRODUCTS,
  stocksTable: process.env.TABLE_STOCKS,
});

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
