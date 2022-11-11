import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 } from "uuid";
import {
  Product,
  productSchema,
  productWithoutStocksSchema,
} from "src/schemas/product";
import { CreateProduct } from "src/schemas/create-product";

export class ProductService {
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

        return productSchema.cast({ id, title, price, description, stocks });
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

    if (!response.Item) return;

    const products = await this.joinStocks([
      productWithoutStocksSchema.cast(response.Item),
    ]);

    return products[0];
  }

  store(product: Product | CreateProduct): Promise<Product> {
    if ("id" in product) return this.update(product);

    return this.put(product);
  }

  async putBatch(productsData: CreateProduct[]): Promise<Product[]> {
    const transactItems = [];
    const products: Product[] = [];

    for (let i = 0; i < productsData.length; i++) {
      const id = this.generateProductId();
      const { stocks, ...productData } = productsData[i];

      transactItems.push(
        {
          Put: {
            TableName: this.config.productsTable,
            Item: { ...productData, id },
          },
        },
        {
          Put: {
            TableName: this.config.stocksTable,
            Item: { product_id: id, stocks },
          },
        }
      );

      products.push(productSchema.cast({ ...productsData[i], id }));
    }

    await this.dynamoDBDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      })
    );

    return products;
  }

  protected async put(product: CreateProduct): Promise<Product> {
    const { stocks, ...productData } = product;
    const id = this.generateProductId();

    await this.dynamoDBDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.config.productsTable,
              Item: { ...productData, id },
            },
          },
          {
            Put: {
              TableName: this.config.stocksTable,
              Item: { stocks, product_id: id },
            },
          },
        ],
      })
    );

    return productSchema.cast({ ...productData, id, stocks });
  }

  protected async update(product: Product): Promise<Product> {
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

    return product;
  }

  protected async joinStocks(
    products: Omit<Product, "stocks">[]
  ): Promise<Product[]> {
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

    const getProductStocks = (productId: Product["id"]) => {
      const stocksData = stocksResponse.Responses[this.config.stocksTable].find(
        ({ product_id }) => product_id === productId
      );

      if (!stocksData) return 0;

      return stocksData.stocks;
    };

    return products.map((product) =>
      productSchema.cast({
        ...product,
        stocks: getProductStocks(product.id),
      })
    );
  }

  protected generateProductId() {
    return v4();
  }
}
