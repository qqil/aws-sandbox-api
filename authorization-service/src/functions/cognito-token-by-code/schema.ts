export const eventSchema = {
  type: "object",
  required: ["body"],
  properties: {
    body: {
      type: "object",
      required: ["code", "redirectUri"],
      properties: {
        code: {
          type: "string",
          minLength: 1,
        },
        redirectUri: {
          type: "string",
          minLength: 1,
        },
      },
    },
  },
};
