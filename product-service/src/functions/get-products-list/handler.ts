import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import createHttpError from "http-errors";
import { ProductService } from "src/services/product.service";

const productService = new ProductService();

const getProductsList = async () => {
  const products = await productService.getAll();

  if (!products) throw new createHttpError.NotFound();

  return formatJSONResponse({ products });
};

export const main = middyfy(getProductsList);
