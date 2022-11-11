import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import cors from "@middy/http-cors";

export const middyfy = (handler) => {
  return middy(handler, { timeoutEarlyInMillis: 0 })
    .use(middyJsonBodyParser())
    .use(httpErrorHandler({ logger: false }))
    .use(cors());
};
