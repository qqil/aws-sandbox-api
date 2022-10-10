import {
  formatJSONResponse,
  FormatJSONResponseOptions,
} from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { ProductService } from "src/services/product.service";

const productService = new ProductService();

const getProductsList = async () => {
  const products = await productService.getAll();

  const options: FormatJSONResponseOptions = {};
  if (!products) options.statusCode = 404;

  return formatJSONResponse({ products }, options);
};

export const main = middyfy(getProductsList);
