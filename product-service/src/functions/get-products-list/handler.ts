import { formatJSONResponse } from "@libs/api-gateway";
import { dynamoDBDocumentClient } from "@libs/dynamodb-client";
import { middyfy } from "@libs/lambda";
import { ProductService } from "@services/product.service";
import createHttpError from "http-errors";

const productService = new ProductService(dynamoDBDocumentClient, {
  productsTable: process.env.TABLE_PRODUCTS,
  stocksTable: process.env.TABLE_STOCKS,
});

const getProductsList = async () => {
  const products = await productService.getAll();

  if (!products) throw new createHttpError.NotFound();

  return formatJSONResponse({ products });
};

export const main = middyfy(getProductsList);
