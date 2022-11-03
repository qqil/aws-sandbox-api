import * as Yup from "yup";
import { productSchemaObject } from "./product";

const { id, ...productSchemaWithoutId } = productSchemaObject;

export const createProductSchema = Yup.object(productSchemaWithoutId);
export type CreateProduct = Yup.InferType<typeof createProductSchema>;
