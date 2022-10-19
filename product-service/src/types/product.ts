export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  stocks: number;
};

export interface ProductServiceInterface {
  getById: (id: Product["id"]) => Promise<Product | undefined>;
  getAll: () => Promise<Product[] | undefined>;
  store: (
    product: Omit<Product, "id"> & { id?: Product["id"] }
  ) => Promise<Product>;
}
