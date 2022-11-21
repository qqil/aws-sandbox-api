import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import validator from "@middy/validator";
import { eventSchema } from "./schema";
import fetch from "node-fetch";
import createHttpError from "http-errors";

const cognitoTokenByCode: ValidatedEventAPIGatewayProxyEvent<
  typeof eventSchema
> = async (event) => {
  const { redirectUri: redirect_uri, code } = event.body;

  const requestUrl = new URL(
    "/oauth2/token",
    `https://${process.env.USER_POOL_DOMAIN}.auth.${process.env.USER_POOL_REGION}.amazoncognito.com/`
  ).toString();

  const response = await fetch(requestUrl, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.USER_POOL_CLIENT_ID,
      client_secret: process.env.USER_POOL_CLIENT_SECRET,
      redirect_uri,
      code,
    }),
  });

  if (!response.ok)
    throw new createHttpError.Unauthorized("Code is not valid.");

  return formatJSONResponse((await response.json()) as any);
};

export const main = middyfy(cognitoTokenByCode).use(validator({ eventSchema }));
