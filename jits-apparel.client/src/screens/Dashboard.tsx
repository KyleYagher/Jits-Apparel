import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import Papa from 'papaparse';
import { apiClient, ProductUploadDto, Product, CarouselItem, CreateCarouselItemDto, UpdateCarouselItemDto, ReorderCarouselItemDto, OrderSummary, Order } from '../services/api';
import { toast } from 'sonner';
import {
  Package,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Truck,
  ShoppingCart,
  Users,
  AlertTriangle,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  Eye,
  Star,
  GripVertical
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

// Mock data
const salesData = [
  { month: 'Jan', sales: 12400, orders: 145 },
  { month: 'Feb', sales: 19800, orders: 234 },
  { month: 'Mar', sales: 15200, orders: 189 },
  { month: 'Apr', sales: 22100, orders: 267 },
  { month: 'May', sales: 28500, orders: 312 },
  { month: 'Jun', sales: 31200, orders: 345 },
];

const categoryData = [
  { name: 'Graphic Tees', value: 400, color: '#ec4899' },
  { name: 'Plain Tees', value: 300, color: '#f97316' },
  { name: 'Limited Edition', value: 200, color: '#eab308' },
  { name: 'Accessories', value: 100, color: '#06b6d4' },
];


const deliveryIntegrations = [
  { name: 'Aramex', status: 'active', lastSync: '2 mins ago', orders: 45 },
  { name: 'The Courier Guy', status: 'active', lastSync: '5 mins ago', orders: 32 },
  { name: 'Pargo', status: 'warning', lastSync: '2 hours ago', orders: 18 },
  { name: 'PostNet', status: 'error', lastSync: 'Failed', orders: 0 },
];

type TabType = 'overview' | 'products' | 'carousel' | 'orders' | 'delivery' | 'analytics';

// Sortable Carousel Item Component
interface SortableCarouselItemProps {
  item: CarouselItem;
  onEdit: (item: CarouselItem) => void;
  onDelete: (item: CarouselItem) => void;
  onToggleActive: (item: CarouselItem) => void;
}

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
      console.log('Fetching products from database...');
      const fetchedProducts = await apiClient.getProducts();
      console.log('Products fetched:', fetchedProducts);
      setProducts(fetchedProducts);
      toast.success(`Loaded ${fetchedProducts.length} products from database`);
    } catch (error) {
      console.error('Error fetching products:', error);
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
      console.error('Error fetching carousel items:', error);
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
  const fetchOrders = async () => {
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
      console.error('Error fetching orders:', error);
      toast.error(`Failed to load orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingOrders(false);
    }
  };

  const viewOrderDetails = async (orderId: number) => {
    try {
      const order = await apiClient.getOrder(orderId);
      setSelectedOrder(order);
    } catch (error) {
      toast.error(`Failed to load order details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      toast.loading('Updating order status...', { id: 'order-status' });
      await apiClient.updateOrderStatus(orderId, { status: newStatus });
      toast.success('Order status updated!', { id: 'order-status' });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = await apiClient.getOrder(orderId);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'order-status' });
    }
  };

  // Fetch orders when orders or overview tab is active
  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'overview') {
      fetchOrders();
    }
  }, [activeTab, orderFilters.status, orderFilters.search, ordersPagination.page]);

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
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

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
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Delivery Integration Status</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Monitor the status of your delivery partner integrations
              </p>

              <div className="space-y-4">
                {deliveryIntegrations.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(integration.status)}
                      <div>
                        <h4 className="font-semibold">{integration.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last sync: {integration.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{integration.orders} orders</p>
                      <button className="text-sm text-pink-600 dark:text-pink-400 hover:underline">
                        View Logs
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Integration Issues Detected</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      PostNet integration is currently experiencing connection issues. Last successful sync was 4 hours ago.
                    </p>
                    <button className="text-sm text-yellow-800 dark:text-yellow-300 hover:underline mt-2">
                      Retry Connection →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Detailed Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Order Volume</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#06b6d4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <h4 className="text-sm text-muted-foreground mb-1">Avg Order Value</h4>
                <p className="text-2xl font-bold">R867</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">+5.2%</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="text-sm text-muted-foreground mb-1">Conversion Rate</h4>
                <p className="text-2xl font-bold">3.24%</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">+0.8%</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="text-sm text-muted-foreground mb-1">Cart Abandonment</h4>
                <p className="text-2xl font-bold">68.5%</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">-2.1%</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="text-sm text-muted-foreground mb-1">Customer Retention</h4>
                <p className="text-2xl font-bold">42.3%</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">+7.4%</p>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {[
                  { name: 'Jits Sunset Tee', sales: 245, revenue: 'R146,755' },
                  { name: 'Urban Vibes Graphic Tee', sales: 198, revenue: 'R118,602' },
                  { name: 'Retro Flow Limited Edition', sales: 156, revenue: 'R124,344' },
                  { name: 'Classic Plain White', sales: 142, revenue: 'R85,158' },
                ].map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                    </div>
                    <p className="font-semibold">{product.revenue}</p>
                  </div>
                ))}
              </div>
            </div>
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
          onStatusUpdate={handleOrderStatusUpdate}
        />
      )}
    </div>
  );
}
