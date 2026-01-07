import { apiClient } from './api';

export interface Product {
  id: number;
  name: string;
  price: number;
}

export const productService = {
  getAll: () => apiClient.get<Product[]>('/products'),
  getById: (id: number) => apiClient.get<Product>(`/products/${id}`),
};
