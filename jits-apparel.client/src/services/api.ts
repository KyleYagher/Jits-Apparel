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

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;
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

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
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

  // Order endpoints - Customer
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    return this.post<Order>('/orders', request);
  }

  async getMyOrders(): Promise<OrderSummary[]> {
    return this.get<OrderSummary[]>('/orders/my-orders');
  }

  async getMyOrder(id: number): Promise<Order> {
    return this.get<Order>(`/orders/my-orders/${id}`);
  }

  // Order endpoints - Admin
  async getAllOrders(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<PaginatedOrderResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);

    const query = queryParams.toString();
    return this.get<PaginatedOrderResponse>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: number): Promise<Order> {
    return this.get<Order>(`/orders/${id}`);
  }

  async updateOrderStatus(id: number, request: UpdateOrderStatusRequest): Promise<Order> {
    return this.put<Order>(`/orders/${id}/status`, request);
  }

  async deleteOrder(id: number): Promise<void> {
    return this.delete<void>(`/orders/${id}`);
  }

  // Order action endpoints
  async resendOrderConfirmation(id: number): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/orders/${id}/resend-confirmation`);
  }

  async processRefund(id: number, request?: RefundRequest): Promise<Order> {
    return this.post<Order>(`/orders/${id}/refund`, request);
  }

  async getOrderInvoice(id: number): Promise<InvoiceData> {
    return this.get<InvoiceData>(`/orders/${id}/invoice`);
  }

  // Shipping endpoints
  async getShippingRates(request: GetShippingRatesRequest): Promise<ShippingRatesResponse> {
    return this.post<ShippingRatesResponse>('/shipping/rates', request);
  }

  async getOrderTracking(orderId: number): Promise<TrackingResponse> {
    return this.get<TrackingResponse>(`/shipping/tracking/order/${orderId}`);
  }

  async getTrackingByReference(trackingReference: string): Promise<TrackingResponse> {
    return this.get<TrackingResponse>(`/shipping/tracking/${encodeURIComponent(trackingReference)}`);
  }

  // Shipment management (Admin)
  async createShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    return this.post<ShipmentResponse>('/shipping/shipments', request);
  }

  async getShipmentLabel(orderId: number): Promise<{ url: string }> {
    return this.get<{ url: string }>(`/shipping/label/${orderId}`);
  }

  async cancelShipment(orderId: number): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/shipping/cancel/${orderId}`);
  }

  async getShippingRatesForOrder(orderId: number): Promise<ShippingRatesResponse> {
    return this.get<ShippingRatesResponse>(`/shipping/rates/order/${orderId}`);
  }

  // Store Settings endpoints
  async getPublicSettings(): Promise<PublicStoreSettings> {
    return this.get<PublicStoreSettings>('/settings');
  }

  async getAdminSettings(): Promise<StoreSettings> {
    return this.get<StoreSettings>('/settings/admin');
  }

  async updateSettings(settings: UpdateStoreSettingsRequest): Promise<StoreSettings> {
    return this.put<StoreSettings>('/settings', settings);
  }

  // Analytics endpoints
  async getAnalyticsDashboard(params?: AnalyticsParams): Promise<AnalyticsDashboard> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);
    if (params?.granularity) queryParams.set('granularity', params.granularity);

    const query = queryParams.toString();
    return this.get<AnalyticsDashboard>(`/analytics/dashboard${query ? `?${query}` : ''}`);
  }

  async getAnalyticsSummary(params?: AnalyticsParams): Promise<AnalyticsSummary> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);

    const query = queryParams.toString();
    return this.get<AnalyticsSummary>(`/analytics/summary${query ? `?${query}` : ''}`);
  }

  async getRevenueAnalytics(params?: AnalyticsParams): Promise<RevenueDataPoint[]> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);
    if (params?.granularity) queryParams.set('granularity', params.granularity);

    const query = queryParams.toString();
    return this.get<RevenueDataPoint[]>(`/analytics/revenue${query ? `?${query}` : ''}`);
  }

  async getOrderVolumeAnalytics(params?: AnalyticsParams): Promise<OrderVolumeDataPoint[]> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);
    if (params?.granularity) queryParams.set('granularity', params.granularity);

    const query = queryParams.toString();
    return this.get<OrderVolumeDataPoint[]>(`/analytics/orders${query ? `?${query}` : ''}`);
  }

  async getTopProductsAnalytics(params?: AnalyticsParams & { limit?: number }): Promise<TopProduct[]> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.get<TopProduct[]>(`/analytics/products/top${query ? `?${query}` : ''}`);
  }

  async getCategorySalesAnalytics(params?: AnalyticsParams): Promise<CategorySales[]> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);

    const query = queryParams.toString();
    return this.get<CategorySales[]>(`/analytics/categories${query ? `?${query}` : ''}`);
  }

  async getInventoryInsights(params?: AnalyticsParams): Promise<InventoryInsights> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);

    const query = queryParams.toString();
    return this.get<InventoryInsights>(`/analytics/inventory${query ? `?${query}` : ''}`);
  }

  async getCustomerAnalytics(params?: AnalyticsParams): Promise<CustomerAnalytics> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params?.toDate) queryParams.set('toDate', params.toDate);

    const query = queryParams.toString();
    return this.get<CustomerAnalytics>(`/analytics/customers${query ? `?${query}` : ''}`);
  }

  async exportAnalyticsCsv(params: AnalyticsExportParams): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.set('fromDate', params.fromDate);
    if (params.toDate) queryParams.set('toDate', params.toDate);
    queryParams.set('type', params.type);

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/analytics/export/csv?${queryParams.toString()}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
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

// Order types
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  notes?: string;
  shippingAddress?: ShippingAddress;
  // Shipping option selected at checkout
  serviceLevelCode?: string;
  serviceLevelName?: string;
  shippingCost?: number;
  deliveryEstimate?: string;
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  // Shipping info
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingAddress?: ShippingAddress;
  carrierName?: string;
  shippingCost?: number;
  serviceLevelCode?: string;
  serviceLevelName?: string;
  shippedDate?: string;
  deliveredDate?: string;
  // Payment info
  paymentMethod?: string;
  paymentStatus: string;
  items: OrderItem[];
  timeline: OrderTimeline[];
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  size?: string;
  color?: string;
}

export interface OrderTimeline {
  status: string;
  timestamp?: string;
  description: string;
  completed: boolean;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  customerName: string;
  customerEmail: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
  trackingNumber?: string;
  adminNote?: string;
}

export interface RefundRequest {
  amount?: number; // null/undefined = full refund
  reason?: string;
  restoreStock?: boolean;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    size?: string;
    color?: string;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  taxRate: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: string;
  carrierName?: string;
  trackingNumber?: string;
  serviceLevelName?: string;
  // Store information for invoice
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  vatNumber?: string;
}

// Shipping types
export interface GetShippingRatesRequest {
  deliveryAddress: ShippingAddress;
  parcels?: Parcel[];
  declaredValue?: number;
}

export interface Parcel {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  description?: string;
}

export interface ShippingRatesResponse {
  rates: ShippingRate[];
  freeShippingAvailable: boolean;
  amountToFreeShipping: number;
}

export interface ShippingRate {
  serviceLevelId: number;
  serviceLevelCode: string;
  serviceLevelName: string;
  rate: number;
  vat: number;
  totalRate: number;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  deliveryEstimate: string;
  collectionHub?: string;
  deliveryHub?: string;
}

export interface TrackingResponse {
  trackingReference: string;
  status: string;
  statusDescription: string;
  collectionHub?: string;
  deliveryHub?: string;
  collectedDate?: string;
  deliveredDate?: string;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  events: TrackingEvent[];
  proofOfDelivery?: ProofOfDelivery;
}

export interface TrackingEvent {
  id: number;
  status: string;
  message: string;
  location?: string;
  eventDate: string;
  source?: string;
}

export interface ProofOfDelivery {
  method: string;
  recipientName?: string;
  imageUrls: string[];
  pdfUrls: string[];
  digitalPodUrl?: string;
  deliveredAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface PaginatedOrderResponse {
  items: OrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Shipment types
export interface CreateShipmentRequest {
  orderId: number;
  serviceLevelCode: string;
  parcels: Parcel[];
  declaredValue?: number;
  collectionInstructions?: string;
  deliveryInstructions?: string;
  muteNotifications?: boolean;
}

export interface ShipmentResponse {
  shipmentId: number;
  trackingReference: string;
  customTrackingReference: string;
  status: string;
  rate: number;
  serviceLevelCode: string;
  serviceLevelName: string;
  estimatedCollection?: string;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  labelUrl?: string;
  parcelTrackingReferences: string[];
  createdAt: string;
}

// Store Settings types
export interface StoreSettings {
  vatRate: number;
  vatEnabled: boolean;
  vatNumber: string;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddressLine1: string;
  storeAddressLine2: string;
  storeCity: string;
  storeProvince: string;
  storePostalCode: string;
  storeCountry: string;
  freeShippingThreshold: number;
  updatedAt?: string;
}

export interface PublicStoreSettings {
  vatRate: number;
  vatEnabled: boolean;
  freeShippingThreshold: number;
  storeName: string;
}

export interface UpdateStoreSettingsRequest {
  vatRate?: number;
  vatEnabled?: boolean;
  vatNumber?: string;
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddressLine1?: string;
  storeAddressLine2?: string;
  storeCity?: string;
  storeProvince?: string;
  storePostalCode?: string;
  storeCountry?: string;
  freeShippingThreshold?: number;
}

// Analytics types
export interface AnalyticsParams {
  fromDate?: string;
  toDate?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

export interface AnalyticsExportParams {
  fromDate?: string;
  toDate?: string;
  type: 'orders' | 'revenue' | 'products' | 'customers';
}

export interface AnalyticsDashboard {
  summary: AnalyticsSummary;
  revenueOverTime: RevenueDataPoint[];
  orderVolumeOverTime: OrderVolumeDataPoint[];
  salesByCategory: CategorySales[];
  topProducts: TopProduct[];
  inventoryInsights: InventoryInsights;
  customerAnalytics: CustomerAnalytics;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  previousPeriodRevenue: number;
  revenueChangePercent: number;
  totalOrders: number;
  previousPeriodOrders: number;
  ordersChangePercent: number;
  averageOrderValue: number;
  previousAverageOrderValue: number;
  aovChangePercent: number;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  previousRetentionRate: number;
  retentionChangePercent: number;
  totalProductsSold: number;
}

export interface RevenueDataPoint {
  period: string;
  date: string;
  grossRevenue: number;
  netRevenue: number;
  shippingRevenue: number;
  orderCount: number;
}

export interface OrderVolumeDataPoint {
  period: string;
  date: string;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

export interface CategorySales {
  categoryId: number;
  categoryName: string;
  revenue: number;
  unitsSold: number;
  orderCount: number;
  percentageOfTotal: number;
  color: string;
}

export interface TopProduct {
  productId: number;
  productName: string;
  productImageUrl?: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  currentStock: number;
  stockStatus: 'critical' | 'low' | 'good';
  revenuePercentOfTotal: number;
}

export interface InventoryInsights {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockAlerts: LowStockAlert[];
  fastMovers: ProductPerformance[];
  slowMovers: ProductPerformance[];
  fastMoverCount: number;
  slowMoverCount: number;
  deadStockCount: number;
}

export interface LowStockAlert {
  productId: number;
  productName: string;
  size?: string;
  currentStock: number;
  reorderThreshold: number;
  urgency: 'critical' | 'low' | 'reorder';
  weeklySalesRate: number;
  daysUntilStockout: number;
}

export interface ProductPerformance {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
  currentStock: number;
  weeklySalesRate: number;
  daysSinceLastSale: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  newCustomerPercent: number;
  returningCustomerPercent: number;
  averageCustomerLifetimeValue: number;
  topCustomers: TopCustomer[];
  customerSegments: CustomerSegment[];
}

export interface TopCustomer {
  userId: number;
  customerName: string;
  customerEmail: string;
  totalOrders: number;
  lifetimeValue: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  segment: 'VIP' | 'Loyal' | 'Regular' | 'New' | 'At Risk';
}

export interface CustomerSegment {
  segmentName: string;
  customerCount: number;
  percentageOfTotal: number;
  totalRevenue: number;
  averageOrderValue: number;
  description: string;
}

export const apiClient = new ApiClient();
