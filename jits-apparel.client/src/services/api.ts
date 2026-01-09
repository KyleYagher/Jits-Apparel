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

    // Handle responses with no content (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
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

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
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

  async deleteProduct(id: number): Promise<void> {
    return this.delete<void>(`/products/${id}`);
  }

  async toggleProductFeatured(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}/toggle-featured`, { method: 'PATCH' });
  }

  // Carousel endpoints
  async getCarouselItems(): Promise<CarouselItem[]> {
    return this.get<CarouselItem[]>('/carousel');
  }

  async getAllCarouselItems(): Promise<CarouselItem[]> {
    return this.get<CarouselItem[]>('/carousel/all');
  }

  async getCarouselItem(id: number): Promise<CarouselItem> {
    return this.get<CarouselItem>(`/carousel/${id}`);
  }

  async createCarouselItem(item: CreateCarouselItemDto): Promise<CarouselItem> {
    return this.post<CarouselItem>('/carousel', item);
  }

  async updateCarouselItem(id: number, item: UpdateCarouselItemDto): Promise<void> {
    return this.request<void>(`/carousel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async deleteCarouselItem(id: number): Promise<void> {
    return this.delete<void>(`/carousel/${id}`);
  }

  async toggleCarouselItemActive(id: number): Promise<CarouselItem> {
    return this.request<CarouselItem>(`/carousel/${id}/toggle-active`, {
      method: 'PATCH'
    });
  }

  async reorderCarouselItems(items: ReorderCarouselItemDto[]): Promise<void> {
    return this.request<void>('/carousel/reorder', {
      method: 'PATCH',
      body: JSON.stringify(items),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async uploadCarouselImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/carousel/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to upload image');
    }

    return response.json();
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
  isFeatured: boolean;
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
  isFeatured: boolean;
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

export interface CarouselItem {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  buttonText: string;
  linkUrl?: string;
  gradientStyle: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCarouselItemDto {
  title: string;
  description?: string;
  imageUrl: string;
  buttonText: string;
  linkUrl?: string;
  gradientStyle: string;
  order: number;
  isActive: boolean;
}

export interface UpdateCarouselItemDto {
  title: string;
  description?: string;
  imageUrl: string;
  buttonText: string;
  linkUrl?: string;
  gradientStyle: string;
  order: number;
  isActive: boolean;
}

export interface ReorderCarouselItemDto {
  id: number;
  order: number;
}

export interface ImageUploadResponse {
  imageUrl: string;
  fileName: string;
}

export const apiClient = new ApiClient();
