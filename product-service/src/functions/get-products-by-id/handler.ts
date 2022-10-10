import {
  formatJSONResponse,
  FormatJSONResponseOptions,
} from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ProductService } from "../../services/product.service";

const productService = new ProductService();

const getProductsById = async (event: APIGatewayProxyEvent) => {
  const { productId } = event.pathParameters;
  const product = await productService.getById(productId);

  const options: FormatJSONResponseOptions = {};
  if (!product) options.statusCode = 404;

  return formatJSONResponse({ product }, options);
};

export const main = middyfy(getProductsById);
