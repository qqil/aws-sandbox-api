import { formatJSONResponse } from "@libs/api-gateway";
import { dynamoDBDocumentClient } from "@libs/dynamodb-client";
import { middyfy } from "@libs/lambda";
import { ProductService } from "@services/product.service";
import { APIGatewayProxyEvent } from "aws-lambda";
import createHttpError from "http-errors";

const productService = new ProductService(dynamoDBDocumentClient, {
  productsTable: process.env.TABLE_PRODUCTS,
  stocksTable: process.env.TABLE_STOCKS,
});

const getProductsById = async (event: APIGatewayProxyEvent) => {
  const { productId } = event.pathParameters;
  const product = await productService.getById(productId);

  if (!product) throw new createHttpError.NotFound();

  return formatJSONResponse({ product });
};

export const main = middyfy(getProductsById);
