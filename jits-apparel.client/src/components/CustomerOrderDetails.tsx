import { X, Package, Truck, MapPin, CreditCard, Clock, CheckCircle, ExternalLink, Mail, Phone, Download } from 'lucide-react';
import { Order } from '../services/api';

interface CustomerOrderDetailsProps {
  order: Order;
  onClose: () => void;
}

export function CustomerOrderDetails({ order, onClose }: CustomerOrderDetailsProps) {
  const statusLower = order.status.toLowerCase();
  const isShippedOrDelivered = statusLower === 'shipped' || statusLower === 'delivered';

  const getStatusBadgeColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleDownloadInvoice = () => {
    alert('Invoice download - Connect to your C# backend to generate PDF');
  };

  const handleTrackShipment = () => {
    if (order.trackingNumber) {
      alert(`Track your shipment with tracking number: ${order.trackingNumber}\nConnect to your C# backend to integrate with shipping provider.`);
    }
  };

  const handleContactSupport = () => {
    alert('Contact Support - Connect to your C# backend to open support ticket.');
  };

  // Build variant string from size and color
  const getVariant = (item: Order['items'][0]) => {
    const parts = [];
    if (item.color) parts.push(item.color);
    if (item.size) parts.push(item.size);
    return parts.length > 0 ? parts.join(' / ') : 'Standard';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Order {order.orderNumber}</h2>
                <p className="text-sm text-muted-foreground">
                    Placed on {new Date(order.orderDate).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <button
                type='button'
                title='Close'
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Status & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-sm">Order Status</span>
              </div>
              <p className="text-lg font-semibold capitalize">{order.status}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Payment</span>
              </div>
              <p className="text-lg font-semibold">{order.paymentStatus}</p>
              {order.paymentMethod && (
                <p className="text-xs text-muted-foreground mt-1">{order.paymentMethod}</p>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="h-4 w-4" />
                <span className="text-sm">Estimated Delivery</span>
              </div>
              <p className="text-lg font-semibold">
                {order.estimatedDelivery || 'TBD'}
              </p>
            </div>
          </div>

          {/* Tracking Information - Only show if order has tracking number and is shipped */}
          {order.trackingNumber && isShippedOrDelivered && (
            <div
              className="rounded-lg p-4 border-2"
              style={{
                borderColor: 'var(--jits-cyan)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-5 w-5" style={{ color: 'var(--jits-cyan)' }} />
                    <h3 className="font-semibold">Tracking Information</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your order is on its way! Track your shipment below.
                  </p>
                  <p className="font-mono text-sm">
                    Tracking #: <span className="font-bold">{order.trackingNumber}</span>
                  </p>
                </div>
                <button
                    type='button'
                    onClick={handleTrackShipment}
                    className="px-4 py-2 rounded-md text-white transition-all hover:opacity-90 flex items-center gap-2"
                    style={{
                        background: 'linear-gradient(90deg, var(--jits-cyan) 0%, var(--jits-pink) 100%)'
                    }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Track Shipment
                </button>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
              <h3 className="text-lg font-semibold">Order Progress</h3>
            </div>
            <div className="space-y-4">
              {order.timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.completed
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-900/30'
                    }`}>
                      {event.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    {index < order.timeline.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-8 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">{event.status}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString('en-ZA', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address - Only show if shipping address exists */}
          {order.shippingAddress && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
                <h3 className="text-lg font-semibold">Delivery Address</h3>
              </div>
              <div className="space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-sm">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-sm">{order.shippingAddress.addressLine2}</p>
                )}
                <p className="text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
                </p>
                <p className="text-sm">{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Customer Info - Show if no shipping address */}
          {!order.shippingAddress && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
                <h3 className="text-lg font-semibold">Customer Information</h3>
              </div>
              <div className="space-y-1">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
              <h3 className="text-lg font-semibold">Items in Your Order</h3>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  {item.productImageUrl ? (
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded border bg-muted flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{getVariant(item)}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">R{item.unitPrice.toFixed(2)} each</p>
                    <p className="font-semibold">R{item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span style={{ color: 'var(--jits-pink)' }}>R{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Order Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`grid grid-cols-1 gap-3 ${order.trackingNumber && isShippedOrDelivered ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <button
              onClick={handleDownloadInvoice}
              className="px-4 py-3 border rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </button>
            {order.trackingNumber && isShippedOrDelivered && (
              <button
                onClick={handleTrackShipment}
                className="px-4 py-3 border rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Track Package
              </button>
            )}
            <button
              onClick={handleContactSupport}
              className="px-4 py-3 border rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </button>
          </div>

          {/* Help Section */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <h4 className="font-semibold mb-2">Need Help?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Have questions about your order? Our support team is here to help!
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="mailto:support@jits.co.za" className="flex items-center gap-2 hover:underline" style={{ color: 'var(--jits-pink)' }}>
                <Mail className="h-4 w-4" />
                support@jits.co.za
              </a>
              <a href="tel:+27123456789" className="flex items-center gap-2 hover:underline" style={{ color: 'var(--jits-pink)' }}>
                <Phone className="h-4 w-4" />
                +27 12 345 6789
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
