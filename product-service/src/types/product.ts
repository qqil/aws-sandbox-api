export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
};

export interface ProductServiceInterface {
  getById: (id: Product["id"]) => Promise<Product | undefined>;
  getAll: () => Promise<Product[] | undefined>;
}
