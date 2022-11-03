export const eventSchema = {
  type: "object",
  required: ["body"],
  properties: {
    body: {
      type: "object",
      required: ["title", "price", "stocks"],
      properties: {
        title: { type: "string", minLength: 3 },
        description: { type: "string" },
        price: { type: "number", minimum: 0 },
        stocks: { type: "number", minimum: 0 },
      },
    },
  },
};
