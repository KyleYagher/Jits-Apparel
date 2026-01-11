import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { apiClient, type OrderSummary, type Order } from '../services/api';
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  Processing: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  Shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  Delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  Cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export function OrderHistory() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyOrders();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (orderId: number) => {
    try {
      setLoadingDetails(true);
      const order = await apiClient.getMyOrder(orderId);
      setSelectedOrder(order);
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrder(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="mb-4">My Orders</h1>
          <p className="text-muted-foreground mb-8">
            Please log in to view your order history.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login?redirect=/orders')}
            className="px-8 py-3 rounded-lg text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
            }}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8">My Orders</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="px-6 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
              }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.Pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-lg border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => viewOrderDetails(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${status.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">
                          {order.orderNumber}
                        </p>
                        <p className="font-medium">
                          R{order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                          {order.status}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">
                          {selectedOrder.orderNumber}
                        </p>
                        <h2 className="text-xl font-semibold">Order Details</h2>
                      </div>
                      <button
                        onClick={closeDetails}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Status Timeline */}
                    <div>
                      <h3 className="font-medium mb-4">Order Status</h3>
                      <div className="space-y-3">
                        {selectedOrder.timeline.map((step, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${step.completed ? 'bg-green-500' : 'bg-muted'}`} />
                            <div className="flex-1">
                              <p className={step.completed ? 'font-medium' : 'text-muted-foreground'}>
                                {step.status}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {step.completed ? formatDateTime(step.timestamp) : step.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="font-medium mb-4">Items</h3>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {item.productImageUrl ? (
                                <img
                                  src={item.productImageUrl}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.size && `Size: ${item.size}`}
                                {item.size && item.color && ' • '}
                                {item.color && `Color: ${item.color}`}
                              </p>
                              <div className="flex justify-between mt-1">
                                <span className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} × R{item.unitPrice.toFixed(2)}
                                </span>
                                <span className="font-medium" style={{ color: 'var(--jits-pink)' }}>
                                  R{item.subtotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>R{selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>Free</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg pt-2 border-t">
                        <span>Total</span>
                        <span style={{ color: 'var(--jits-pink)' }}>
                          R{selectedOrder.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Order Date */}
                    <div className="text-sm text-muted-foreground">
                      Ordered on {formatDate(selectedOrder.orderDate)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
