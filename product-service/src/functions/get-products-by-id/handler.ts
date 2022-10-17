import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayProxyEvent } from "aws-lambda";
import createHttpError from "http-errors";
import { ProductService } from "../../services/product.service";

const productService = new ProductService();

const getProductsById = async (event: APIGatewayProxyEvent) => {
  const { productId } = event.pathParameters;
  const product = await productService.getById(productId);

  if (!product) throw new createHttpError.NotFound();

  return formatJSONResponse({ product });
};

export const main = middyfy(getProductsById);
