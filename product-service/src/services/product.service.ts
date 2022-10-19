import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 } from "uuid";
import type { Product, ProductServiceInterface } from "src/types/product";

export class ProductService implements ProductServiceInterface {
  constructor(
    protected readonly dynamoDBDocumentClient: DynamoDBDocumentClient,
    protected readonly config: { productsTable: string; stocksTable: string }
  ) {}

  async getAll(): Promise<Product[]> {
    const productsResponse = await this.dynamoDBDocumentClient.send(
      new ScanCommand({ TableName: this.config.productsTable })
    );
    const stocksResponse = await this.dynamoDBDocumentClient.send(
      new ScanCommand({ TableName: this.config.stocksTable })
    );

    const products: Product[] = productsResponse.Items.map(
      ({ id, title, price, description }) => {
        const { stocks } = stocksResponse.Items.find(
          ({ product_id }) => product_id === id
        );

        return { id, title, price, description, stocks };
      }
    );

    return products;
  }

  async getById(id: Product["id"]): Promise<Product | undefined> {
    const response = await this.dynamoDBDocumentClient.send(
      new GetCommand({
        TableName: this.config.productsTable,
        Key: { id },
      })
    );

    const products = await this.joinStocks([response.Item] as Product[]);

    return products[0];
  }

  async store(product: Partial<Product>): Promise<Product> {
    return this[product.id ? "update" : "put"](product);
  }

  protected async put(product: Partial<Product>): Promise<Product> {
    const { stocks, ...productData } = product;
    productData.id = this.generateProductId();

    await this.dynamoDBDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.config.productsTable,
              Item: productData,
            },
          },
          {
            Put: {
              TableName: this.config.stocksTable,
              Item: { stocks, product_id: productData.id },
            },
          },
        ],
      })
    );

    return { ...productData, stocks } as Product;
  }

  protected async update(product: Partial<Product>) {
    const { id, stocks, ...productData } = product;

    await this.dynamoDBDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: this.config.productsTable,
              Key: { id },
              UpdateExpression:
                "set title = :title, description = :description, price = :price",
              ExpressionAttributeValues: {
                ...productData,
              },
            },
          },
          {
            Update: {
              TableName: this.config.stocksTable,
              Key: { product_id: id },
              UpdateExpression: "set stocks = :stocks",
              ExpressionAttributeValues: { stocks },
            },
          },
        ],
      })
    );

    return product as Product;
  }

  protected async joinStocks(products: Product[]): Promise<Product[]> {
    const stocksResponse = await this.dynamoDBDocumentClient.send(
      new BatchGetCommand({
        RequestItems: {
          [this.config.stocksTable]: {
            Keys: products.map((item) => ({
              product_id: item.id,
            })),
          },
        },
      })
    );

    stocksResponse.Responses[this.config.stocksTable].forEach((stockItem) => {
      const product = products.find(
        (product) => product.id === stockItem.product_id
      );

      if (!product) return;

      product.stocks = stockItem.stocks;
    });

    return products;
  }

  protected generateProductId() {
    return v4();
  }
}
