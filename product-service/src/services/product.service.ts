import type { Product, ProductServiceInterface } from "src/types/product";
import products from "./products.json";

export class ProductService implements ProductServiceInterface {
  async getAll(): Promise<Product[]> {
    return products;
  }

  async getById(id: Product["id"]): Promise<Product | undefined> {
    return products.find((p) => p.id === id);
  }
}
