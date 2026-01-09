import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { products } from '../data/products';
import { Product } from '../types';
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
  Settings,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProductDetail } from './ProductDetail';
import { EditProduct } from './EditProduct';
import { DeleteConfirmation } from './DeleteConfirmation';
import { OrderDetails, DetailedOrder } from './OrderDetails';

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

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: 'R599', status: 'delivered', date: '2026-01-07' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: 'R1199', status: 'processing', date: '2026-01-07' },
  { id: 'ORD-003', customer: 'Mike Johnson', amount: 'R799', status: 'shipped', date: '2026-01-06' },
  { id: 'ORD-004', customer: 'Sarah Williams', amount: 'R1599', status: 'pending', date: '2026-01-06' },
  { id: 'ORD-005', customer: 'David Brown', amount: 'R599', status: 'delivered', date: '2026-01-05' },
];

const deliveryIntegrations = [
  { name: 'Aramex', status: 'active', lastSync: '2 mins ago', orders: 45 },
  { name: 'The Courier Guy', status: 'active', lastSync: '5 mins ago', orders: 32 },
  { name: 'Pargo', status: 'warning', lastSync: '2 hours ago', orders: 18 },
  { name: 'PostNet', status: 'error', lastSync: 'Failed', orders: 0 },
];

const stats = [
  { label: 'Total Revenue', value: 'R284,320', change: '+12.5%', icon: TrendingUp, color: 'from-pink-500 to-orange-500' },
  { label: 'Total Orders', value: '1,842', change: '+8.2%', icon: ShoppingCart, color: 'from-orange-500 to-yellow-500' },
  { label: 'Total Products', value: '156', change: '+23', icon: Package, color: 'from-yellow-500 to-cyan-500' },
  { label: 'Active Users', value: '12,543', change: '+18.4%', icon: Users, color: 'from-cyan-500 to-pink-500' },
];

type TabType = 'overview' | 'products' | 'carousel' | 'orders' | 'delivery' | 'analytics';

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [heroImages, setHeroImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
  ]);

  // Product modal states
  const [selectedProductForView, setSelectedProductForView] = useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState<Product | null>(null);
  
  // Order modal state
  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);

  // Function to convert basic order to detailed order
  const getDetailedOrder = (basicOrder: typeof recentOrders[0]): DetailedOrder => {
    return {
      ...basicOrder,
      status: basicOrder.status as DetailedOrder['status'],
      customerEmail: `${basicOrder.customer.toLowerCase().replace(' ', '.')}@example.com`,
      customerPhone: '+27 ' + Math.floor(Math.random() * 900000000 + 100000000),
      customerType: Math.random() > 0.5 ? 'Registered' : 'Guest',
      paymentStatus: basicOrder.status === 'pending' ? 'Pending' : 'Paid',
      paymentMethod: 'Credit Card (•••• 4242)',
      shippingAddress: {
        fullName: basicOrder.customer,
        addressLine1: '123 Main Street',
        addressLine2: 'Apartment 4B',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa',
      },
      shippingMethod: 'Standard Delivery (3-5 business days)',
      trackingNumber: basicOrder.status === 'shipped' || basicOrder.status === 'delivered' ? `TCG${Math.floor(Math.random() * 1000000000)}` : undefined,
      deliveryNotes: 'Please leave package at the front door if not home',
      items: [
        {
          id: '1',
          productName: 'Jits Sunset Tee',
          productImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
          sku: 'JST-001-BLK-L',
          variant: 'Size: L, Color: Black',
          quantity: 1,
          unitPrice: 599,
          lineTotal: 599,
        },
        ...(parseFloat(basicOrder.amount.replace('R', '')) > 600 ? [{
          id: '2',
          productName: 'Classic Plain White',
          productImage: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200',
          sku: 'CPW-001-WHT-M',
          variant: 'Size: M, Color: White',
          quantity: 1,
          unitPrice: 549,
          lineTotal: 549,
        }] : []),
      ],
      subtotal: parseFloat(basicOrder.amount.replace('R', '')) - 150,
      discount: 0,
      tax: Math.round((parseFloat(basicOrder.amount.replace('R', '')) - 150) * 0.15),
      shipping: 65,
      total: parseFloat(basicOrder.amount.replace('R', '')),
      timeline: [
        {
          status: 'Order Placed',
          timestamp: `${basicOrder.date} 10:14 AM`,
          description: 'Your order has been received and is being processed',
          completed: true,
        },
        {
          status: 'Payment Confirmed',
          timestamp: `${basicOrder.date} 10:15 AM`,
          description: 'Payment has been successfully processed',
          completed: basicOrder.status !== 'pending',
        },
        {
          status: 'Processing',
          timestamp: `${basicOrder.date} 11:02 AM`,
          description: 'Your order is being prepared for shipment',
          completed: ['processing', 'shipped', 'delivered'].includes(basicOrder.status),
        },
        {
          status: 'Shipped',
          timestamp: new Date(new Date(basicOrder.date).getTime() + 86400000).toISOString().split('T')[0] + ' 09:20 AM',
          description: 'Your order has been dispatched',
          completed: ['shipped', 'delivered'].includes(basicOrder.status),
        },
        {
          status: 'Delivered',
          timestamp: 'Pending',
          description: 'Your order will be delivered soon',
          completed: basicOrder.status === 'delivered',
        },
      ],
      notes: [
        {
          id: '1',
          text: 'Customer requested gift wrapping',
          author: 'Admin',
          timestamp: `${basicOrder.date} 10:20 AM`,
          internal: true,
        },
        {
          id: '2',
          text: 'Please deliver before 5 PM',
          author: basicOrder.customer,
          timestamp: `${basicOrder.date} 10:14 AM`,
          internal: false,
        },
      ],
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // In real app: parse CSV and upload to backend
      setTimeout(() => {
        alert(`File "${file.name}" uploaded successfully! (This is a mock - connect to your C# backend)`);
        setUploadFile(null);
      }, 1500);
    }
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setHeroImages([...heroImages, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeHeroImage = (index: number) => {
    setHeroImages(heroImages.filter((_, i) => i !== index));
  };

  const handleProductSave = (updatedProduct: Product) => {
    // In real app: send to C# backend
    alert(`Product "${updatedProduct.name}" updated successfully! Connect to your C# backend to persist changes.`);
    setSelectedProductForEdit(null);
  };

  const handleProductDelete = () => {
    // In real app: send delete request to C# backend
    alert(`Product "${selectedProductForDelete?.name}" deleted successfully! Connect to your C# backend to persist changes.`);
    setSelectedProductForDelete(null);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-orange-50/30 to-cyan-50/50 dark:from-pink-950/20 dark:via-orange-950/10 dark:to-cyan-950/20">
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
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
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
                      ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white'
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
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
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
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
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
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">{order.id}</td>
                        <td className="py-3 px-4">{order.customer}</td>
                        <td className="py-3 px-4 font-semibold">{order.amount}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                Upload a CSV file containing product information. Required columns: name, description, price, category, image_url, sizes, colors
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
                    alert('Download template CSV with example data');
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
                  <p className="text-sm text-muted-foreground mt-1">{products.length} total products</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                  />
                  <button
                    className="px-4 py-2 rounded-md text-white text-sm transition-all hover:opacity-90"
                    style={{
                      background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                    }}
                    onClick={() => alert('Add new product functionality - connect to your C# backend')}
                  >
                    + Add Product
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Sizes</th>
                      <th className="text-left py-3 px-4">Colors</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded border"
                            />
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
                            {product.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">R{product.price}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {product.sizes.map((size, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-muted text-xs"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {product.colors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full border-2 border-muted-foreground/20"
                                style={{ backgroundColor: color.toLowerCase() }}
                                title={color}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            In Stock
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="View"
                              onClick={() => setSelectedProductForView(product)}
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Edit"
                              onClick={() => setSelectedProductForEdit(product)}
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
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
              </div>
            </div>
          </div>
        )}

        {/* Hero Carousel Tab */}
        {activeTab === 'carousel' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Manage Hero Carousel Images</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload and manage the images displayed in the homepage hero carousel. Recommended size: 1920x600px
              </p>

              {/* Current Images */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {heroImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Hero ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        onClick={() => removeHeroImage(index)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Position {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload New Image */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  className="hidden"
                  id="hero-upload"
                />
                <label htmlFor="hero-upload" className="cursor-pointer">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">Add New Hero Image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">All Orders</h3>
                <div className="flex gap-2">
                  <select className="px-3 py-1 border rounded-md text-sm">
                    <option>All Statuses</option>
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="px-3 py-1 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Order ID</th>
                      <th className="text-left py-3 px-4">Customer</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">{order.id}</td>
                        <td className="py-3 px-4">{order.customer}</td>
                        <td className="py-3 px-4 font-semibold">{order.amount}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{order.date}</td>
                        <td className="py-3 px-4">
                          <button
                            className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                            onClick={() => setSelectedOrder(getDetailedOrder(order))}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
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
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}