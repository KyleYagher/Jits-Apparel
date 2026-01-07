const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles?: string[];
  };
}

export class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('jits-access-token');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    console.log('API Request:', { url, method: options?.method, hasToken: !!token });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    console.log('API Response:', { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;
      console.error('API Error:', errorMessage, errorData);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', credentials);
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', data);
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    return this.get<AuthResponse['user']>('/auth/me');
  }

  // Product endpoints
  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>('/products');
  }

  async uploadProducts(products: ProductUploadDto[]): Promise<ProductUploadResult> {
    return this.post<ProductUploadResult>('/products/upload', products);
  }

  async createProduct(product: CreateProductDto): Promise<Product> {
    return this.post<Product>('/products', product);
  }
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
}

export interface ProductUploadDto {
  name: string;
  price: number;
  description?: string;
  stockQuantity: number;
  imageUrl?: string;
  categoryId: number;
}

export interface CreateProductDto {
  name: string;
  price: number;
  description?: string;
  stockQuantity: number;
  imageUrl?: string;
  categoryId: number;
  isActive: boolean;
}

export interface ProductUploadResult {
  successCount: number;
  failureCount: number;
  errors: string[];
  detailedErrors: Array<{
    rowNumber: number;
    productName: string;
    error: string;
  }>;
}

export const apiClient = new ApiClient();
