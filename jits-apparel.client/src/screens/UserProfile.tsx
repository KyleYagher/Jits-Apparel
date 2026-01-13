import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { CustomerOrderDetails } from '../components/CustomerOrderDetails';
import { User, ShoppingBag, Settings, Mail, Edit2, Check, X, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, OrderSummary, Order } from '../services/api';

export function UserProfile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { cart } = useCart();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);

  // Fetch user's orders on mount
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const orders = await apiClient.getMyOrders();
      setOrderHistory(orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      setIsLoadingOrderDetails(true);
      const order = await apiClient.getMyOrder(orderId);
      setSelectedOrder(order);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  if (!user) {
    // Redirect to login if not authenticated
    navigate('login');
    return null;
  }

  const handleSaveProfile = () => {
    updateProfile({ name: editedName });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setEditedName(user.name);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--jits-pink) 0%, var(--jits-cyan) 100%)'
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="mb-1">{user.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Your shopping activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="text-2xl">{orderHistory.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cart Items</span>
                    <span className="text-2xl">{cart.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Wishlist</span>
                    <span className="text-2xl">0</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cart.length > 0 ? (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="text-sm">Added {cart.length} item(s) to cart</p>
                        <p className="text-xs text-muted-foreground">Recently</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm">Account created</p>
                      <p className="text-xs text-muted-foreground">Welcome to Jits!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <Card 
              className="border-2"
              style={{
                borderColor: 'var(--jits-pink)',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)'
              }}
            >
              <CardHeader>
                <CardTitle>Continue Shopping</CardTitle>
                <CardDescription>
                  Discover our latest super cool, funky designs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('shop')}
                  className="text-white"
                  style={{
                    background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 50%, var(--jits-cyan) 100%)'
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse Collection
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Track your past and current orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading orders...</span>
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/shop')}
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.orderDate).toLocaleDateString('en-ZA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Badge
                            className="capitalize"
                            variant={order.status.toLowerCase() === 'delivered' ? 'default' : 'secondary'}
                            style={order.status.toLowerCase() === 'delivered' ? {
                              backgroundColor: 'var(--jits-cyan)',
                              color: 'white'
                            } : {}}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                            </span>
                            <span className="mx-2">•</span>
                            <span className="font-semibold">R {order.totalAmount.toFixed(2)}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order.id)}
                            disabled={isLoadingOrderDetails}
                            className="gap-2"
                          >
                            {isLoadingOrderDetails ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                            View Order
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={!isEditing}
                    />
                    {isEditing ? (
                      <>
                        <Button
                          size="icon"
                          onClick={handleSaveProfile}
                          style={{
                            backgroundColor: 'var(--jits-cyan)',
                            color: 'white'
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-display">Email</Label>
                  <Input
                    id="email-display"
                    value={user.email}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="gap-2">
                  <X className="w-4 h-4" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Order Details Modal */}
      {selectedOrder && (
        <CustomerOrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}