import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/useAuth';
import Papa from 'papaparse';
import { apiClient, ProductUploadDto, Product, CarouselItem, CreateCarouselItemDto, UpdateCarouselItemDto, ReorderCarouselItemDto, OrderSummary, Order, ShippingRate, CreateShipmentRequest, TrackingResponse, StoreSettings, AnalyticsDashboard, AnalyticsParams } from '../services/api';
import { toast } from 'sonner';
import {
  Package,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Truck,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  Eye,
  Star,
  GripVertical,
  RefreshCw,
  ExternalLink,
  MapPin,
  Loader2,
  Send,
  Ban,
  Settings, 
  AlertTriangle
} from 'lucide-react';
import { ProductDetail } from '../components/ProductDetail';
import { EditProduct } from '../components/EditProduct';
import { DeleteConfirmation } from '../components/DeleteConfirmation';
import { AddProduct, NewProductData } from '../components/AddProduct';
import { AddCarouselItem } from '../components/AddCarouselItem';
import { EditCarouselItem } from '../components/EditCarouselItem';
import { SplashScreen } from '../components/SplashScreen';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OrderDetails } from '../components/OrderDetails';

// Date range options for analytics
type DateRangeOption = '7d' | '30d' | '90d' | 'ytd' | 'custom';

const getDateRange = (option: DateRangeOption): { fromDate: string; toDate: string } => {
  const now = new Date();
  const toDate = now.toISOString().split('T')[0];
  let fromDate: string;

  switch (option) {
    case '7d':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '30d':
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '90d':
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'ytd':
      fromDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      break;
    default:
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  return { fromDate, toDate };
};

const formatCurrency = (amount: number): string => {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};


// Delivery tab types
interface PendingShipment {
  order: Order;
  // Only used as fallback if customer's selection is missing
  rates: ShippingRate[];
  selectedRate?: ShippingRate;
  isLoadingRates: boolean;
  // Whether to show rate selection (only when customer selection is missing)
  needsRateSelection: boolean;
}

interface ActiveShipment {
  order: Order;
  tracking?: TrackingResponse;
  isLoadingTracking: boolean;
}

type TabType = 'overview' | 'products' | 'carousel' | 'orders' | 'delivery' | 'analytics' | 'settings';

// Sortable Carousel Item Component
interface SortableCarouselItemProps {
  item: CarouselItem;
  onEdit: (item: CarouselItem) => void;
  onDelete: (item: CarouselItem) => void;
  onToggleActive: (item: CarouselItem) => void;
}

type SalesDataEntry = {
  month: string;
  sales: number;
  orders: number;
};

const salesData: SalesDataEntry[] = [
  { month: 'Jan', sales: 42000, orders: 120 },
  { month: 'Feb', sales: 51000, orders: 145 },
  { month: 'Mar', sales: 47000, orders: 132 },
  { month: 'Apr', sales: 62000, orders: 178 },
  { month: 'May', sales: 70000, orders: 201 },
  { month: 'Jun', sales: 68000, orders: 190 },
];

type CategoryDataEntry = {
  name: string;
  value: number;
  color: string;
};

const categoryData: CategoryDataEntry[] = [
  { name: 'Graphic Tees', value: 420, color: '#ec4899' },
  { name: 'Plain Tees', value: 310, color: '#06b6d4' },
  { name: 'Limited Editions', value: 180, color: '#8b5cf6' },
  { name: 'Oversized Fits', value: 260, color: '#22c55e' },
];





function SortableCarouselItem({ item, onEdit, onDelete, onToggleActive }: SortableCarouselItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const gradientPreview = {
    'pink-orange': 'linear-gradient(90deg, #ec4899 0%, #f97316 100%)',
    'orange-yellow': 'linear-gradient(90deg, #f97316 0%, #eab308 100%)',
    'yellow-cyan': 'linear-gradient(90deg, #eab308 0%, #06b6d4 100%)',
    'cyan-pink': 'linear-gradient(90deg, #06b6d4 0%, #ec4899 100%)',
  }[item.gradientStyle] || 'linear-gradient(90deg, #ec4899 0%, #f97316 100%)';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-muted/30 border rounded-lg p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Image Preview */}
        <div className="shrink-0">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-32 h-20 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/200x120?text=Image+Error';
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
              {item.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{item.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-muted rounded">
                  Order: {item.order}
                </span>
                <span className="px-2 py-1 rounded" style={{ background: gradientPreview, color: 'white' }}>
                  {item.gradientStyle}
                </span>
                <span className="px-2 py-1 bg-muted rounded">
                  Button: "{item.buttonText}"
                </span>
                {item.linkUrl && (
                  <span className="px-2 py-1 bg-muted rounded flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.linkUrl}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleActive(item)}
                className={`p-2 rounded transition-colors ${
                  item.isActive
                    ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
                }`}
                title={item.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
              >
                {item.isActive ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carousel state
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loadingCarousel, setLoadingCarousel] = useState(false);

  // Product modal states
  const [selectedProductForView, setSelectedProductForView] = useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Order state
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilters, setOrderFilters] = useState({ status: '', search: '' });
  const [ordersPagination, setOrdersPagination] = useState({ totalCount: 0, totalPages: 0, page: 1 });

  // Carousel modal states
  const [selectedCarouselItem, setSelectedCarouselItem] = useState<CarouselItem | null>(null);
  const [showAddCarouselItem, setShowAddCarouselItem] = useState(false);
  const [showEditCarouselItem, setShowEditCarouselItem] = useState(false);

  // Delivery state
  const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>([]);
  const [activeShipments, setActiveShipments] = useState<ActiveShipment[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<'checking' | 'active' | 'error'>('checking');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [creatingShipment, setCreatingShipment] = useState<number | null>(null);

  // Settings state
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboard | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRangeOption>('30d');
  const [analyticsGranularity, setAnalyticsGranularity] = useState<AnalyticsParams['granularity']>('daily');
  const [exportingCsv, setExportingCsv] = useState(false);

  // Filter products based on search term
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.category?.name.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: 'Total Revenue', value: 'R129,400', change: '+12.5%', icon: TrendingUp, color: 'from-pink-500 to-orange-500' },
    { label: 'Total Orders', value: '1,492', change: '+8.2%', icon: ShoppingCart, color: 'from-orange-500 to-yellow-500' },
    { label: 'Total Products', value: products.length.toString(), change: '+4', icon: Package, color: 'from-yellow-500 to-cyan-500' },
    { label: 'Active Users', value: '2,847', change: '+23.1%', icon: Users, color: 'from-cyan-500 to-pink-500' },
  ];

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const fetchedProducts = await apiClient.getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      toast.error(`Failed to load products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);

    try {
      // Parse CSV file
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // Map CSV data to ProductUploadDto
            const products: ProductUploadDto[] = results.data.map((row) => ({
              name: row.name || row.Name || '',
              price: parseFloat(row.price || row.Price || '0'),
              description: row.description || row.Description || '',
              stockQuantity: parseInt(row.stockQuantity || row.StockQuantity || row.stock_quantity || '0', 10),
              imageUrl: row.imageUrl || row.ImageUrl || row.image_url || '',
              categoryId: parseInt(row.categoryId || row.CategoryId || row.category_id || '1', 10),
            }));

            // Upload to backend
            toast.loading(`Uploading ${products.length} products...`, { id: 'upload' });
            const result = await apiClient.uploadProducts(products);

            setUploadFile(null);

            // Show results
            if (result.failureCount === 0) {
              toast.success(`Successfully uploaded ${result.successCount} products!`, { id: 'upload' });
              // Refresh products list
              fetchProducts();
            } else if (result.successCount === 0) {
              toast.error(`Failed to upload products. ${result.failureCount} errors found.`, { id: 'upload' });
              // Show detailed errors
              if (result.errors.length > 0) {
                setTimeout(() => {
                  alert(`Upload Errors:\n\n${result.errors.slice(0, 10).join('\n')}\n${result.errors.length > 10 ? `\n...and ${result.errors.length - 10} more errors` : ''}`);
                }, 100);
              }
            } else {
              toast.warning(`Uploaded ${result.successCount} products with ${result.failureCount} errors.`, { id: 'upload' });
              // Refresh products list
              fetchProducts();
              // Show detailed errors
              if (result.errors.length > 0) {
                setTimeout(() => {
                  alert(`Upload Errors:\n\n${result.errors.slice(0, 10).join('\n')}\n${result.errors.length > 10 ? `\n...and ${result.errors.length - 10} more errors` : ''}`);
                }, 100);
              }
            }
          } catch (error) {
            setUploadFile(null);
            toast.error(`Failed to upload products: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'upload' });
          }
        },
        error: (error) => {
          setUploadFile(null);
          toast.error(`Failed to parse CSV: ${error.message}`);
        },
      });
    } catch (error) {
      setUploadFile(null);
      toast.error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Carousel handlers
  const fetchCarouselItems = async () => {
    try {
      setLoadingCarousel(true);
      const items = await apiClient.getAllCarouselItems();
      setCarouselItems(items);
    } catch (error) {
      toast.error(`Failed to load carousel items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingCarousel(false);
    }
  };

  const handleCarouselItemCreate = async (newItem: CreateCarouselItemDto) => {
    try {
      toast.loading('Creating carousel item...', { id: 'carousel-create' });
      await apiClient.createCarouselItem(newItem);
      toast.success('Carousel item created successfully!', { id: 'carousel-create' });
      setShowAddCarouselItem(false);
      fetchCarouselItems();
    } catch (error) {
      toast.error(`Failed to create carousel item: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'carousel-create' });
    }
  };

  const handleCarouselItemUpdate = async (id: number, updates: UpdateCarouselItemDto) => {
    try {
      toast.loading('Updating carousel item...', { id: 'carousel-update' });
      await apiClient.updateCarouselItem(id, updates);
      toast.success('Carousel item updated successfully!', { id: 'carousel-update' });
      setShowEditCarouselItem(false);
      setSelectedCarouselItem(null);
      fetchCarouselItems();
    } catch (error) {
      toast.error(`Failed to update carousel item: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'carousel-update' });
    }
  };

  const handleCarouselItemDelete = async (item: CarouselItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      toast.loading('Deleting carousel item...', { id: 'carousel-delete' });
      await apiClient.deleteCarouselItem(item.id);
      toast.success('Carousel item deleted successfully!', { id: 'carousel-delete' });
      fetchCarouselItems();
    } catch (error) {
      toast.error(`Failed to delete carousel item: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'carousel-delete' });
    }
  };

  const handleToggleCarouselActive = async (item: CarouselItem) => {
    try {
      const updatedItem = await apiClient.toggleCarouselItemActive(item.id);
      toast.success(`Carousel item ${updatedItem.isActive ? 'activated' : 'deactivated'}!`);
      setCarouselItems(carouselItems.map(i => i.id === updatedItem.id ? updatedItem : i));
    } catch (error) {
      toast.error(`Failed to toggle active status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = carouselItems.findIndex(item => item.id === active.id);
      const newIndex = carouselItems.findIndex(item => item.id === over.id);

      const reorderedItems = arrayMove(carouselItems, oldIndex, newIndex);
      setCarouselItems(reorderedItems);

      // Update order values and send to backend
      const reorderDtos: ReorderCarouselItemDto[] = reorderedItems.map((item, index) => ({
        id: item.id,
        order: index
      }));

      try {
        await apiClient.reorderCarouselItems(reorderDtos);
        toast.success('Carousel items reordered successfully!');
      } catch (error) {
        toast.error(`Failed to save new order ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Revert on error
        fetchCarouselItems();
      }
    }
  };

  // Fetch carousel items when carousel tab is active
  useEffect(() => {
    if (activeTab === 'carousel') {
      fetchCarouselItems();
    }
  }, [activeTab]);

  // Order handlers
  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const response = await apiClient.getAllOrders({
        page: ordersPagination.page,
        status: orderFilters.status || undefined,
        search: orderFilters.search || undefined,
      });
      setOrders(response.items);
      setOrdersPagination({
        totalCount: response.totalCount,
        totalPages: response.totalPages,
        page: response.page,
      });
    } catch (error) {
      toast.error(`Failed to load orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingOrders(false);
    }
  }, [ordersPagination.page, orderFilters.status, orderFilters.search]);

  const viewOrderDetails = async (orderId: number) => {
    try {
      const order = await apiClient.getOrder(orderId);
      setSelectedOrder(order);
    } catch (error) {
      toast.error(`Failed to load order details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch orders when orders or overview tab is active
  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'overview') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  // Delivery handlers
  const fetchDeliveryData = async () => {
    try {
      setLoadingDelivery(true);
      setIntegrationStatus('checking');

      // Get all orders to categorize them
      const response = await apiClient.getAllOrders({ pageSize: 100 });
      const allOrders = response.items;

      // Separate into pending (needs shipment) and active (has tracking)
      const pending: PendingShipment[] = [];
      const active: ActiveShipment[] = [];

      for (const orderSummary of allOrders) {
        // Get full order details
        const order = await apiClient.getOrder(orderSummary.id);

        if (order.status === 'Processing' && !order.trackingNumber) {
          // Order is processing but no shipment created yet
          // Check if customer already selected a shipping option during checkout
          const hasCustomerSelection = !!(order.serviceLevelCode && order.serviceLevelName);

          pending.push({
            order,
            rates: [],
            isLoadingRates: false,
            needsRateSelection: !hasCustomerSelection
          });
        } else if (order.trackingNumber && (order.status === 'Shipped' || order.status === 'Processing')) {
          // Order has been shipped - fetch tracking
          active.push({
            order,
            isLoadingTracking: false
          });
        }
      }

      setPendingShipments(pending);
      setActiveShipments(active);
      setIntegrationStatus('active');
      setLastSyncTime(new Date());
    } catch (error) {
      setIntegrationStatus('error');
      toast.error(`Failed to load delivery data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingDelivery(false);
    }
  };

  const fetchRatesForOrder = async (orderId: number) => {
    setPendingShipments(prev => prev.map(ps =>
      ps.order.id === orderId ? { ...ps, isLoadingRates: true } : ps
    ));

    try {
      const rates = await apiClient.getShippingRatesForOrder(orderId);
      setPendingShipments(prev => prev.map(ps =>
        ps.order.id === orderId
          ? { ...ps, rates: rates.rates, isLoadingRates: false, selectedRate: rates.rates[0] }
          : ps
      ));
    } catch (error) {
      toast.error(`Failed to get shipping rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPendingShipments(prev => prev.map(ps =>
        ps.order.id === orderId ? { ...ps, isLoadingRates: false } : ps
      ));
    }
  };

  const selectRate = (orderId: number, rate: ShippingRate) => {
    setPendingShipments(prev => prev.map(ps =>
      ps.order.id === orderId ? { ...ps, selectedRate: rate } : ps
    ));
  };

  const createShipmentForOrder = async (orderId: number, serviceLevelCode: string) => {
    setCreatingShipment(orderId);
    try {
      toast.loading('Creating shipment...', { id: `shipment-${orderId}` });

      const request: CreateShipmentRequest = {
        orderId,
        serviceLevelCode,
        parcels: [
          {
            lengthCm: 30,
            widthCm: 25,
            heightCm: 5,
            weightKg: 0.5,
            description: 'Apparel'
          }
        ]
      };

      const shipment = await apiClient.createShipment(request);
      toast.success(`Shipment created! Tracking: ${shipment.trackingReference}`, { id: `shipment-${orderId}` });

      // Refresh delivery data
      await fetchDeliveryData();
    } catch (error) {
      toast.error(`Failed to create shipment: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: `shipment-${orderId}` });
    } finally {
      setCreatingShipment(null);
    }
  };

  const fetchTrackingForOrder = async (orderId: number) => {
    setActiveShipments(prev => prev.map(as =>
      as.order.id === orderId ? { ...as, isLoadingTracking: true } : as
    ));

    try {
      const tracking = await apiClient.getOrderTracking(orderId);
      setActiveShipments(prev => prev.map(as =>
        as.order.id === orderId ? { ...as, tracking, isLoadingTracking: false } : as
      ));
    } catch (error) {
      toast.error(`Failed to get tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setActiveShipments(prev => prev.map(as =>
        as.order.id === orderId ? { ...as, isLoadingTracking: false } : as
      ));
    }
  };

  const openLabelUrl = async (orderId: number) => {
    try {
      const result = await apiClient.getShipmentLabel(orderId);
      window.open(result.url, '_blank');
    } catch (error) {
      toast.error(`Failed to get label: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const cancelShipmentForOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this shipment?')) return;

    try {
      toast.loading('Cancelling shipment...', { id: `cancel-${orderId}` });
      await apiClient.cancelShipment(orderId);
      toast.success('Shipment cancelled', { id: `cancel-${orderId}` });
      await fetchDeliveryData();
    } catch (error) {
      toast.error(`Failed to cancel: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: `cancel-${orderId}` });
    }
  };

  // Fetch delivery data when delivery tab is active
  useEffect(() => {
    if (activeTab === 'delivery') {
      fetchDeliveryData();
    }
  }, [activeTab]);

  // Fetch settings when settings tab is active
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const settings = await apiClient.getAdminSettings();
      setStoreSettings(settings);
    } catch (error) {
      toast.error(`Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  // Analytics data fetching
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const { fromDate, toDate } = getDateRange(analyticsDateRange);
      const data = await apiClient.getAnalyticsDashboard({
        fromDate,
        toDate,
        granularity: analyticsGranularity,
      });
      setAnalyticsData(data);
    } catch (error) {
      toast.error(`Failed to load analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [analyticsDateRange, analyticsGranularity]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);

  const handleExportCsv = async (type: 'orders' | 'revenue' | 'products' | 'customers') => {
    try {
      setExportingCsv(true);
      const { fromDate, toDate } = getDateRange(analyticsDateRange);
      const blob = await apiClient.exportAnalyticsCsv({ fromDate, toDate, type });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${fromDate}-to-${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`);
    } catch (error) {
      toast.error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!storeSettings) return;

    try {
      setSavingSettings(true);
      const updated = await apiClient.updateSettings({
        vatRate: storeSettings.vatRate,
        vatEnabled: storeSettings.vatEnabled,
        vatNumber: storeSettings.vatNumber,
        storeName: storeSettings.storeName,
        storeEmail: storeSettings.storeEmail,
        storePhone: storeSettings.storePhone,
        storeAddressLine1: storeSettings.storeAddressLine1,
        storeAddressLine2: storeSettings.storeAddressLine2,
        storeCity: storeSettings.storeCity,
        storeProvince: storeSettings.storeProvince,
        storePostalCode: storeSettings.storePostalCode,
        storeCountry: storeSettings.storeCountry,
        freeShippingThreshold: storeSettings.freeShippingThreshold,
      });
      setStoreSettings(updated);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleProductAdd = async (newProductData: NewProductData) => {
    try {
      toast.loading('Adding product...', { id: 'add-product' });
      const createdProduct = await apiClient.createProduct(newProductData);
      toast.success(`Product "${createdProduct.name}" added successfully!`, { id: 'add-product' });
      setShowAddProduct(false);
      // Refresh products list
      fetchProducts();
    } catch (error) {
      toast.error(`Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'add-product' });
    }
  };

  const handleProductSave = (updatedProduct: Product) => {
    // In real app: send to C# backend
    alert(`Product "${updatedProduct.name}" updated successfully! Connect to your C# backend to persist changes.`);
    setSelectedProductForEdit(null);
  };

  const handleProductDelete = async () => {
    if (!selectedProductForDelete) return;

    try {
      toast.loading('Deleting product...', { id: 'delete-product' });
      await apiClient.deleteProduct(selectedProductForDelete.id);
      toast.success(`Product "${selectedProductForDelete.name}" deleted successfully!`, { id: 'delete-product' });
      setSelectedProductForDelete(null);
      // Refresh products list
      fetchProducts();
    } catch (error) {
      toast.error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'delete-product' });
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const updatedProduct = await apiClient.toggleProductFeatured(product.id);
      toast.success(`Product "${product.name}" ${updatedProduct.isFeatured ? 'marked as featured' : 'removed from featured'}!`);
      // Update the product in the local state
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } catch (error) {
      toast.error(`Failed to update featured status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'products' as TabType, label: 'Products', icon: Package },
    { id: 'carousel' as TabType, label: 'Hero Carousel', icon: ImageIcon },
    { id: 'orders' as TabType, label: 'Orders', icon: ShoppingCart },
    { id: 'delivery' as TabType, label: 'Delivery', icon: Truck },
    { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50/50 via-orange-50/30 to-cyan-50/50 dark:from-pink-950/20 dark:via-orange-950/10 dark:to-cyan-950/20">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl" style={{ fontFamily: 'Yesteryear, cursive' }}>
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user?.name}! 👋
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-linear-to-r from-pink-500 to-cyan-500 text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-linear-to-br ${stat.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Chart */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#ec4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <button
                  className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                  onClick={() => setActiveTab('orders')}
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Order ID</th>
                        <th className="text-left py-3 px-4">Customer</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-sm">{order.orderNumber}</td>
                          <td className="py-3 px-4">{order.customerName}</td>
                          <td className="py-3 px-4 font-semibold">R{order.totalAmount.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status.toLowerCase())}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString('en-ZA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Product Master</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file containing product information. Required columns: name, price, description, stockQuantity, imageUrl, categoryId
              </p>
              
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="product-upload"
                />
                <label htmlFor="product-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">CSV files only (Max 5MB)</p>
                  {uploadFile && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      Uploading: {uploadFile.name}...
                    </p>
                  )}
                </label>
              </div>

              <div className="mt-6">
                <a
                  href="#"
                  className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    // Create CSV template
                    const template = `name,price,description,stockQuantity,imageUrl,categoryId
"Sample Product Name",599.00,"Sample product description",50,"https://example.com/image.jpg",1
"Another Product",799.00,"Another description",25,"https://example.com/image2.jpg",2`;

                    const blob = new Blob([template], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'product-upload-template.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success('Template downloaded successfully!');
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Download CSV Template
                </a>
              </div>
            </div>

            {/* Product Management Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Bulk Operations</h4>
                <p className="text-sm text-muted-foreground">Update multiple products at once using CSV import</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Inventory Sync</h4>
                <p className="text-sm text-muted-foreground">Automatically sync stock levels from your backend</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Price Updates</h4>
                <p className="text-sm text-muted-foreground">Schedule price changes and promotional pricing</p>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">All Products</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loadingProducts ? 'Loading...' : `${filteredProducts.length} of ${products.length} products`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type='button'
                    className="px-4 py-2 rounded-md text-white text-sm transition-all hover:opacity-90"
                    style={{
                      background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                    }}
                    onClick={() => setShowAddProduct(true)}
                  >
                    + Add Product
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loadingProducts ? (
                  <SplashScreen mode="inline" show={true} message="Loading products..." size="sm" minHeight="200px" />
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No products found in database</p>
                    <p className="text-sm text-muted-foreground">Upload a CSV file to add products</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No products match your search</p>
                    <p className="text-sm text-muted-foreground">Try a different search term</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Product</th>
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">Price</th>
                        <th className="text-left py-3 px-4">Stock</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-center py-3 px-4">Featured</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted">
                              {product.category?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold">R{product.price.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.stockQuantity > 10
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : product.stockQuantity > 0
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {product.stockQuantity} units
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <button
                                type='button'
                                className="p-1.5 hover:bg-muted rounded transition-colors"
                                title={product.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                                onClick={() => handleToggleFeatured(product)}
                              >
                                <Star
                                  className={`h-5 w-5 transition-colors ${
                                    product.isFeatured
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type='button'
                                className="p-1.5 hover:bg-muted rounded transition-colors"
                                title="View"
                                onClick={() => setSelectedProductForView(product)}
                              >
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                type='button'
                                className="p-1.5 hover:bg-muted rounded transition-colors"
                                title="Edit"
                                onClick={() => setSelectedProductForEdit(product)}
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                type='button'
                                className="p-1.5 hover:bg-muted rounded transition-colors"
                                title="Delete"
                                onClick={() => setSelectedProductForDelete(product)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Carousel Tab */}
        {activeTab === 'carousel' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Manage Hero Carousel Items</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loadingCarousel ? 'Loading...' : `${carouselItems.length} carousel items`}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setShowAddCarouselItem(true)}
                  className="px-4 py-2 rounded-md text-white text-sm transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)' }}
                >
                  + Add Carousel Item
                </button>
              </div>

              {loadingCarousel ? (
                <SplashScreen mode="inline" show={true} message="Loading carousel items..." size="sm" minHeight="200px" />
              ) : carouselItems.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No carousel items yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Carousel Item" to create your first slide</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={carouselItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {carouselItems.map((item) => (
                        <SortableCarouselItem
                          key={item.id}
                          item={item}
                          onEdit={(item) => {
                            setSelectedCarouselItem(item);
                            setShowEditCarouselItem(true);
                          }}
                          onDelete={handleCarouselItemDelete}
                          onToggleActive={handleToggleCarouselActive}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">All Orders</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loadingOrders ? 'Loading...' : `${orders.length} of ${ordersPagination.totalCount} orders`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                    title='Status selection'
                    value={orderFilters.status}
                    onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                    value={orderFilters.search}
                    onChange={(e) => setOrderFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {loadingOrders ? (
                  <SplashScreen mode="inline" show={true} message="Loading orders..." size="sm" minHeight="200px" />
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No orders found</p>
                    <p className="text-sm text-muted-foreground">Orders will appear here when customers place them</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Order ID</th>
                          <th className="text-left py-3 px-4">Customer</th>
                          <th className="text-left py-3 px-4">Amount</th>
                          <th className="text-left py-3 px-4">Items</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 font-mono text-sm">{order.orderNumber}</td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold">R{order.totalAmount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{order.itemCount} items</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status.toLowerCase())}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(order.orderDate).toLocaleDateString('en-ZA')}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                                onClick={() => viewOrderDetails(order.id)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Pagination */}
                    {ordersPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Page {ordersPagination.page} of {ordersPagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                            disabled={ordersPagination.page <= 1}
                            onClick={() => setOrdersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          >
                            Previous
                          </button>
                          <button
                            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                            disabled={ordersPagination.page >= ordersPagination.totalPages}
                            onClick={() => setOrdersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            {/* Integration Status Card */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Ship Logic Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    The Courier Guy API - Manage shipments and tracking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchDeliveryData}
                  disabled={loadingDelivery}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingDelivery ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {integrationStatus === 'checking' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {integrationStatus === 'active' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {integrationStatus === 'error' && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">The Courier Guy</h4>
                    <p className="text-sm text-muted-foreground">
                      {integrationStatus === 'checking' && 'Checking connection...'}
                      {integrationStatus === 'active' && 'Connected and ready'}
                      {integrationStatus === 'error' && 'Connection failed'}
                    </p>
                  </div>
                </div>
                <div className="ml-auto text-right text-sm">
                  {lastSyncTime && (
                    <p className="text-muted-foreground">
                      Last sync: {lastSyncTime.toLocaleTimeString()}
                    </p>
                  )}
                  <p className="font-medium">
                    {pendingShipments.length} pending · {activeShipments.length} active
                  </p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loadingDelivery && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Pending Shipments - Orders that need shipping */}
            {!loadingDelivery && pendingShipments.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Shipments ({pendingShipments.length})
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Orders ready to be shipped with customer-selected delivery options
                </p>

                <div className="space-y-4">
                  {pendingShipments.map((ps) => (
                    <div key={ps.order.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">{ps.order.orderNumber}</p>
                          <p className="font-semibold">{ps.order.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {ps.order.shippingAddress?.city}, {ps.order.shippingAddress?.province}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">R{ps.order.totalAmount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {ps.order.items?.length || 0} items
                          </p>
                        </div>
                      </div>

                      {/* Customer's Selected Shipping - Direct shipment creation */}
                      {!ps.needsRateSelection && ps.order.serviceLevelCode && (
                        <div className="space-y-3">
                          {/* Show customer's selection */}
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="font-medium text-sm">Customer selected:</p>
                                  <p className="text-green-700 dark:text-green-400">{ps.order.serviceLevelName}</p>
                                </div>
                              </div>
                              {ps.order.shippingCost !== undefined && (
                                <p className="font-semibold">R{ps.order.shippingCost.toFixed(2)}</p>
                              )}
                            </div>
                          </div>

                          {/* Create Shipment Button */}
                          <button
                            type="button"
                            onClick={() => createShipmentForOrder(ps.order.id, ps.order.serviceLevelCode!)}
                            disabled={creatingShipment === ps.order.id}
                            className="w-full py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                              background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                            }}
                          >
                            {creatingShipment === ps.order.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating Shipment...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Create Shipment
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Fallback: Rate Selection needed (no customer selection) */}
                      {ps.needsRateSelection && (
                        <>
                          {/* Warning that no shipping was selected */}
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              No shipping option was selected at checkout. Please select a rate below.
                            </p>
                          </div>

                          {/* Get Rates Button */}
                          {ps.rates.length === 0 && (
                            <button
                              type="button"
                              onClick={() => fetchRatesForOrder(ps.order.id)}
                              disabled={ps.isLoadingRates}
                              className="w-full py-2 border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                            >
                              {ps.isLoadingRates ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Loading rates...
                                </>
                              ) : (
                                <>
                                  <Truck className="h-4 w-4" />
                                  Get Shipping Rates
                                </>
                              )}
                            </button>
                          )}

                          {/* Rate Selection */}
                          {ps.rates.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Select shipping service:</p>
                              <div className="space-y-2">
                                {ps.rates.map((rate) => (
                                  <label
                                    key={rate.serviceLevelCode}
                                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                      ps.selectedRate?.serviceLevelCode === rate.serviceLevelCode
                                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                                        : 'hover:bg-muted'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name={`rate-${ps.order.id}`}
                                        checked={ps.selectedRate?.serviceLevelCode === rate.serviceLevelCode}
                                        onChange={() => selectRate(ps.order.id, rate)}
                                        className="text-pink-500"
                                      />
                                      <div>
                                        <p className="font-medium">{rate.serviceLevelName}</p>
                                        <p className="text-sm text-muted-foreground">{rate.deliveryEstimate}</p>
                                      </div>
                                    </div>
                                    <p className="font-semibold">R{rate.totalRate.toFixed(2)}</p>
                                  </label>
                                ))}
                              </div>

                              {/* Create Shipment Button */}
                              <button
                                type="button"
                                onClick={() => ps.selectedRate && createShipmentForOrder(ps.order.id, ps.selectedRate.serviceLevelCode)}
                                disabled={!ps.selectedRate || creatingShipment === ps.order.id}
                                className="w-full py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{
                                  background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                                }}
                              >
                                {creatingShipment === ps.order.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating Shipment...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4" />
                                    Create Shipment
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Shipments - Orders with tracking */}
            {!loadingDelivery && activeShipments.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  Active Shipments ({activeShipments.length})
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Orders in transit - track and manage shipments
                </p>

                <div className="space-y-4">
                  {activeShipments.map((as) => (
                    <div key={as.order.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">{as.order.orderNumber}</p>
                          <p className="font-semibold">{as.order.customerName}</p>
                          {as.order.trackingNumber && (
                            <p className="text-sm font-mono text-muted-foreground">
                              Tracking: {as.order.trackingNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            as.order.status === 'Delivered'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {as.order.status}
                          </span>
                          {as.order.carrierName && (
                            <p className="text-sm text-muted-foreground mt-1">{as.order.carrierName}</p>
                          )}
                        </div>
                      </div>

                      {/* Tracking Info */}
                      {as.tracking && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{as.tracking.statusDescription}</span>
                          </div>
                          {as.tracking.events.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Last update: {new Date(as.tracking.events[0].eventDate).toLocaleString()}
                              {as.tracking.events[0].location && ` - ${as.tracking.events[0].location}`}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fetchTrackingForOrder(as.order.id)}
                          disabled={as.isLoadingTracking}
                          className="flex-1 py-2 border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                        >
                          {as.isLoadingTracking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Update Tracking
                        </button>
                        <button
                          type="button"
                          onClick={() => openLabelUrl(as.order.id)}
                          className="py-2 px-4 border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Label
                        </button>
                        {as.order.status !== 'Delivered' && (
                          <button
                            type="button"
                            onClick={() => cancelShipmentForOrder(as.order.id)}
                            className="py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                          >
                            <Ban className="h-4 w-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingDelivery && pendingShipments.length === 0 && activeShipments.length === 0 && (
              <div className="bg-card border rounded-lg p-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Shipments</h3>
                <p className="text-muted-foreground mb-4">
                  Orders with "Processing" status will appear here for shipment creation.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-pink-600 dark:text-pink-400 hover:underline"
                >
                  View All Orders →
                </button>
              </div>
            )}

            {/* Integration Info */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Integration Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1">API Provider</h4>
                  <p className="text-sm text-muted-foreground">Ship Logic (The Courier Guy)</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1">Environment</h4>
                  <p className="text-sm text-muted-foreground">Sandbox (Development)</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1">Features</h4>
                  <p className="text-sm text-muted-foreground">Rates, Shipments, Tracking, Labels</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Date Range & Export Controls */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Date Range:</label>
                  <select
                    title='Select Date Range'
                    value={analyticsDateRange}
                    onChange={(e) => setAnalyticsDateRange(e.target.value as DateRangeOption)}
                    className="px-3 py-1.5 border rounded-md text-sm bg-background"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="ytd">Year to Date</option>
                  </select>
                  <select
                    title='Select Granularity'
                    value={analyticsGranularity}
                    onChange={(e) => setAnalyticsGranularity(e.target.value as AnalyticsParams['granularity'])}
                    className="px-3 py-1.5 border rounded-md text-sm bg-background"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button
                    onClick={() => fetchAnalytics()}
                    disabled={loadingAnalytics}
                    className="px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => e.target.value && handleExportCsv(e.target.value as 'orders' | 'revenue' | 'products' | 'customers')}
                    disabled={exportingCsv}
                    className="px-3 py-1.5 border rounded-md text-sm bg-background"
                    defaultValue=""
                    aria-label="Export analytics data"
                    title="Export analytics data"
                  >
                    <option value="" disabled>Export CSV...</option>
                    <option value="orders">Orders Data</option>
                    <option value="revenue">Revenue Data</option>
                    <option value="products">Products Data</option>
                    <option value="customers">Customers Data</option>
                  </select>
                  {exportingCsv && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            </div>

            {loadingAnalytics && !analyticsData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : analyticsData ? (
              <>
                {/* Revenue & Order Volume Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Revenue Over Time</h3>
                        <p className="text-sm text-muted-foreground">Gross revenue trends</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-3xl font-bold">{formatCurrency(analyticsData.summary.totalRevenue)}</p>
                      <p className={`text-sm mt-1 ${analyticsData.summary.revenueChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPercent(analyticsData.summary.revenueChangePercent)} vs previous period
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analyticsData.revenueOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="grossRevenue" fill="#ec4899" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Order Volume</h3>
                        <p className="text-sm text-muted-foreground">Orders with AOV overlay</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-3xl font-bold">{analyticsData.summary.totalOrders.toLocaleString()} orders</p>
                      <p className={`text-sm mt-1 ${analyticsData.summary.ordersChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPercent(analyticsData.summary.ordersChangePercent)} vs previous period
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analyticsData.orderVolumeOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `R${value.toFixed(0)}`} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="totalOrders" stroke="#06b6d4" strokeWidth={2} name="Orders" />
                        <Line yAxisId="right" type="monotone" dataKey="averageOrderValue" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" name="Avg Order Value" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Commerce Metrics */}
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Key Commerce Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-help" title="Indicates upsell/bundle success. Higher is better.">
                      <h4 className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        Avg Order Value (AOV)
                        <span className="text-xs">ℹ️</span>
                      </h4>
                      <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.averageOrderValue)}</p>
                      <p className={`text-sm mt-1 ${analyticsData.summary.aovChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPercent(analyticsData.summary.aovChangePercent)} from {formatCurrency(analyticsData.summary.previousAverageOrderValue)}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-help" title="Total products sold in period">
                      <h4 className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        Products Sold
                        <span className="text-xs">ℹ️</span>
                      </h4>
                      <p className="text-2xl font-bold">{analyticsData.summary.totalProductsSold.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">units in period</p>
                    </div>
                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-help" title="Total unique customers">
                      <h4 className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        Total Customers
                        <span className="text-xs">ℹ️</span>
                      </h4>
                      <p className="text-2xl font-bold">{analyticsData.summary.totalCustomers.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {analyticsData.summary.newCustomers} new, {analyticsData.summary.returningCustomers} returning
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-help" title="Measures brand loyalty - very important">
                      <h4 className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        Customer Retention
                        <span className="text-xs">ℹ️</span>
                      </h4>
                      <p className="text-2xl font-bold">{analyticsData.summary.customerRetentionRate.toFixed(1)}%</p>
                      <p className={`text-sm mt-1 ${analyticsData.summary.retentionChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPercent(analyticsData.summary.retentionChangePercent)} from {analyticsData.summary.previousRetentionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Sales Chart */}
                {analyticsData.salesByCategory.length > 0 && (
                  <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analyticsData.salesByCategory}
                            dataKey="revenue"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ categoryName, percentageOfTotal }) => `${categoryName} (${percentageOfTotal.toFixed(1)}%)`}
                          >
                            {analyticsData.salesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {analyticsData.salesByCategory.map((category, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="text-sm font-medium">{category.categoryName}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(category.revenue)}</p>
                              <p className="text-xs text-muted-foreground">{category.unitsSold} units</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Performance */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Top Selling Products</h3>
                      <p className="text-sm text-muted-foreground">Performance insights with stock levels</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                    >
                      View All Products
                    </button>
                  </div>
                  <div className="space-y-3">
                    {analyticsData.topProducts.length > 0 ? (
                      analyticsData.topProducts.map((product, index) => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-semibold text-muted-foreground">#{index + 1}</div>
                              <div>
                                <p className="font-medium">{product.productName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.unitsSold} sold | {product.categoryName}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">Stock:</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  product.stockStatus === 'critical'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : product.stockStatus === 'low'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {product.currentStock} units
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No product sales data for this period</p>
                    )}
                  </div>
                </div>

                {/* Inventory Insights & Customer Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Inventory Insights */}
                  <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Inventory Insights</h3>

                    {/* Low Stock Alerts */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        Low Stock Alerts ({analyticsData.inventoryInsights.lowStockCount})
                      </h4>
                      <div className="space-y-2">
                        {analyticsData.inventoryInsights.lowStockAlerts.length > 0 ? (
                          analyticsData.inventoryInsights.lowStockAlerts.slice(0, 5).map((item, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-2 border rounded text-sm ${
                              item.urgency === 'critical'
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                            }`}>
                              <span>{item.productName}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{item.currentStock} left</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  item.urgency === 'critical' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                }`}>
                                  {item.urgency === 'critical' ? 'Critical' : 'Reorder'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No low stock alerts</p>
                        )}
                      </div>
                    </div>

                    {/* Performance Categories */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Inventory Status</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Fast Movers</span>
                            <span className="text-sm font-bold">{analyticsData.inventoryInsights.fastMoverCount} products</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Selling 20+ units/week</p>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Dead Stock</span>
                            <span className="text-sm font-bold">{analyticsData.inventoryInsights.deadStockCount} products</span>
                          </div>
                          <p className="text-xs text-muted-foreground">2 or fewer sales in period</p>
                        </div>
                        <div className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Out of Stock</span>
                            <span className="text-sm font-bold">{analyticsData.inventoryInsights.outOfStockCount} products</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Analytics */}
                  <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Customer Analytics</h3>

                    {/* New vs Returning */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-3">New vs Returning Customers</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">New Customers</p>
                          <p className="text-2xl font-bold">{analyticsData.customerAnalytics.newCustomerPercent.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground mt-1">{analyticsData.customerAnalytics.newCustomers} customers</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Returning</p>
                          <p className="text-2xl font-bold">{analyticsData.customerAnalytics.returningCustomerPercent.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground mt-1">{analyticsData.customerAnalytics.returningCustomers} customers</p>
                        </div>
                      </div>
                    </div>

                    {/* Top Customers */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Top Customers by Lifetime Value</h4>
                      <div className="space-y-2">
                        {analyticsData.customerAnalytics.topCustomers.length > 0 ? (
                          analyticsData.customerAnalytics.topCustomers.slice(0, 4).map((customer, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                  {customer.customerName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">{customer.customerName}</p>
                                  <p className="text-xs text-muted-foreground">{customer.totalOrders} orders</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(customer.lifetimeValue)}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  customer.segment === 'VIP'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                    : customer.segment === 'Loyal'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                  {customer.segment}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No customer data available</p>
                        )}
                      </div>
                    </div>

                    {/* Customer Segments Summary */}
                    {analyticsData.customerAnalytics.customerSegments.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Customer Segments</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {analyticsData.customerAnalytics.customerSegments.map((segment, idx) => (
                            <div key={idx} className="p-2 bg-muted/30 rounded text-xs">
                              <p className="font-medium">{segment.segmentName}</p>
                              <p className="text-muted-foreground">{segment.customerCount} ({segment.percentageOfTotal.toFixed(1)}%)</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No analytics data available. Try adjusting the date range.</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {loadingSettings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : storeSettings ? (
              <>
                {/* VAT Settings */}
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">VAT Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">Enable VAT</label>
                        <p className="text-sm text-muted-foreground">Calculate and display VAT on orders and invoices</p>
                      </div>
                      <button
                        type="button"
                        title="Toggle VAT"
                        onClick={() => setStoreSettings({ ...storeSettings, vatEnabled: !storeSettings.vatEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          storeSettings.vatEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            storeSettings.vatEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">VAT Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={storeSettings.vatRate}
                          onChange={(e) => setStoreSettings({ ...storeSettings, vatRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          placeholder="15"
                        />
                        <p className="text-xs text-muted-foreground mt-1">South African VAT is 15%</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">VAT Number</label>
                        <input
                          type="text"
                          value={storeSettings.vatNumber}
                          onChange={(e) => setStoreSettings({ ...storeSettings, vatNumber: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          placeholder="4XXXXXXXXXX"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Displayed on invoices</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Information */}
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Store Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">This information appears on invoices and order confirmations.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Store Name</label>
                      <input
                        type="text"
                        value={storeSettings.storeName}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="Jits Apparel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Store Email</label>
                      <input
                        type="email"
                        value={storeSettings.storeEmail}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="info@jitsapparel.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Store Phone</label>
                      <input
                        type="tel"
                        value={storeSettings.storePhone}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Store Address */}
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Store Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={storeSettings.storeAddressLine1}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeAddressLine1: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="Street address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={storeSettings.storeAddressLine2}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeAddressLine2: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="Suite, floor, etc. (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={storeSettings.storeCity}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeCity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="Johannesburg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Province</label>
                      <select
                        title="Province"
                        value={storeSettings.storeProvince}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeProvince: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="">Select Province</option>
                        <option value="Gauteng">Gauteng</option>
                        <option value="Western Cape">Western Cape</option>
                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                        <option value="Eastern Cape">Eastern Cape</option>
                        <option value="Free State">Free State</option>
                        <option value="Limpopo">Limpopo</option>
                        <option value="Mpumalanga">Mpumalanga</option>
                        <option value="Northern Cape">Northern Cape</option>
                        <option value="North West">North West</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={storeSettings.storePostalCode}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storePostalCode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <input
                        type="text"
                        value={storeSettings.storeCountry}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeCountry: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="South Africa"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Settings */}
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Shipping Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Free Shipping Threshold (R)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={storeSettings.freeShippingThreshold}
                        onChange={(e) => setStoreSettings({ ...storeSettings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                        className="w-full max-w-xs px-3 py-2 border rounded-md bg-background"
                        placeholder="500"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Orders above this amount qualify for free shipping. Set to 0 to disable free shipping.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-6 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                    }}
                  >
                    {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Settings
                  </button>
                </div>

                {/* Last Updated Info */}
                {storeSettings.updatedAt && (
                  <p className="text-sm text-muted-foreground text-right">
                    Last updated: {new Date(storeSettings.updatedAt).toLocaleString('en-ZA')}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Failed to load settings</p>
                <button
                  type="button"
                  onClick={fetchSettings}
                  className="mt-4 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Modals */}
      {showAddProduct && (
        <AddProduct
          onClose={() => setShowAddProduct(false)}
          onSave={handleProductAdd}
        />
      )}
      {selectedProductForView && (
        <ProductDetail
          product={selectedProductForView}
          onClose={() => setSelectedProductForView(null)}
        />
      )}
      {selectedProductForEdit && (
        <EditProduct
          product={selectedProductForEdit}
          onClose={() => setSelectedProductForEdit(null)}
          onSave={handleProductSave}
        />
      )}
      {selectedProductForDelete && (
        <DeleteConfirmation
          product={selectedProductForDelete}
          onClose={() => setSelectedProductForDelete(null)}
          onDelete={handleProductDelete}
        />
      )}

      {/* Carousel Modals */}
      {showAddCarouselItem && (
        <AddCarouselItem
          onClose={() => setShowAddCarouselItem(false)}
          onSave={handleCarouselItemCreate}
          maxOrder={carouselItems.length > 0 ? Math.max(...carouselItems.map(i => i.order)) : 0}
        />
      )}
      {showEditCarouselItem && selectedCarouselItem && (
        <EditCarouselItem
          item={selectedCarouselItem}
          onClose={() => {
            setShowEditCarouselItem(false);
            setSelectedCarouselItem(null);
          }}
          onSave={handleCarouselItemUpdate}
        />
      )}
      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdate={(updatedOrder) => {
            setSelectedOrder(updatedOrder);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
