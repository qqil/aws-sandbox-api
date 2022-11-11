import * as Yup from "yup";

export const productSchemaObject = {
  id: Yup.string().required(),
  title: Yup.string().min(3).required(),
  description: Yup.string().default(""),
  price: Yup.number().min(0).required(),
  stocks: Yup.number().min(0).required(),
};

const { stocks, ...productWithoutStocksSchemaObject } = productSchemaObject;

export const productWithoutStocksSchema = Yup.object(
  productWithoutStocksSchemaObject
);
export const productSchema = Yup.object(productSchemaObject);
export type Product = Yup.InferType<typeof productSchema>;
