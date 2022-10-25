import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import type { FromSchema } from "json-schema-to-ts";

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, "body"> & {
  body: FromSchema<S>;
};
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<
  ValidatedAPIGatewayProxyEvent<S>,
  APIGatewayProxyResult
>;

export type FormatJSONResponseOptions = Partial<
  Omit<APIGatewayProxyResult, "body">
>;

export const formatJSONResponse = (
  response: Record<string, unknown>,
  options?: FormatJSONResponseOptions
) => {
  return {
    statusCode: 200,
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify(response),
  };
};
