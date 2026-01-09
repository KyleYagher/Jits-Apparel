import { X, Package, CreditCard, Truck, MapPin, User, Mail, FileText, Clock, CheckCircle, XCircle, Copy, Download, RotateCcw  } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  sku: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderTimeline {
  status: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface OrderNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  internal: boolean;
}

export interface DetailedOrder {
  id: string;
  customer: string;
  amount: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  date: string;
  // Customer Details
  customerEmail: string;
  customerPhone: string;
  customerType: 'Guest' | 'Registered';
  // Payment
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  paymentMethod: string;
  // Shipping
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  shippingMethod: string;
  trackingNumber?: string;
  deliveryNotes?: string;
  // Order Items
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  // Timeline
  timeline: OrderTimeline[];
  // Notes
  notes: OrderNote[];
}

interface OrderDetailsProps {
  order: DetailedOrder;
  onClose: () => void;
}

export function OrderDetails({ order, onClose }: OrderDetailsProps) {
  const [newNote, setNewNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [showTrackingInput, setShowTrackingInput] = useState(false);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'paid': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'refunded': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleCopyEmail = () => {
    try {
      navigator.clipboard.writeText(order.customerEmail);
      toast.success('Email copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      toast.error(`Error copying email to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const textArea = document.createElement('textarea');
      textArea.value = order.customerEmail;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Email copied to clipboard!');
      } catch (err) {
        toast.error(`Error copying email to clipboard: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyAddress = (address: typeof order.shippingAddress) => {
    const formatted = `${address.fullName}\n${address.addressLine1}${address.addressLine2 ? '\n' + address.addressLine2 : ''}\n${address.city}, ${address.province} ${address.postalCode}\n${address.country}`;
    try {
      navigator.clipboard.writeText(formatted);
      toast.success('Address copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
        toast.error(`Error copying address to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
        const textArea = document.createElement('textarea');
        textArea.value = formatted;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Address copied to clipboard!');
      } catch (err) {
        toast.error(`Error copying address to clipboard: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      alert(`Note added: "${newNote}"\nConnect to your C# backend to persist notes.`);
      setNewNote('');
    }
  };

  const handleUpdateTracking = () => {
    alert(`Tracking number updated: ${trackingNumber}\nConnect to your C# backend to save.`);
    setShowTrackingInput(false);
  };

  const handleStatusChange = (newStatus: string) => {
    alert(`Order status would be changed to: ${newStatus}\nConnect to your C# backend to update.`);
  };

  const handleDownloadInvoice = () => {
    alert('Invoice download - Connect to your C# backend to generate PDF');
  };

  const handleIssueRefund = () => {
    if (confirm(`Issue refund for order ${order.id}?\nAmount: ${order.amount}`)) {
      alert('Refund initiated - Connect to your C# backend to process.');
    }
  };

  const handleCancelOrder = () => {
    if (confirm(`Cancel order ${order.id}?`)) {
      alert('Order cancelled - Connect to your C# backend to update.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold font-mono">{order.id}</h2>
                <p className="text-sm text-muted-foreground">{order.date} at {new Date(order.date).toLocaleTimeString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <button
                title='Close'
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary - Top Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Total Amount</span>
              </div>
              <p className="text-2xl font-bold">{order.amount}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Payment Status</span>
              </div>
              <p className="text-lg font-semibold">{order.paymentStatus}</p>
              <p className="text-xs text-muted-foreground mt-1">{order.paymentMethod}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-sm">Items</span>
              </div>
              <p className="text-lg font-semibold">{order.items.length} Products</p>
              <p className="text-xs text-muted-foreground mt-1">{order.items.reduce((sum, item) => sum + item.quantity, 0)} Total Units</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="h-4 w-4" />
                <span className="text-sm">Shipping</span>
              </div>
              <p className="text-lg font-semibold">{order.shippingMethod}</p>
              {order.trackingNumber && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">{order.trackingNumber}</p>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-lg font-semibold">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium">{order.customer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer Type</p>
                <span className="px-2 py-1 rounded-md bg-muted text-sm font-medium">
                  {order.customerType}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${order.customerEmail}`} className="text-pink-600 dark:text-pink-400 hover:underline">
                    {order.customerEmail}
                  </a>
                  <button
                    onClick={handleCopyEmail}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Copy email"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Shipping & Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  <h3 className="text-lg font-semibold">Shipping Address</h3>
                </div>
                <button
                  onClick={() => handleCopyAddress(order.shippingAddress)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
              {order.deliveryNotes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Delivery Notes:</p>
                  <p className="text-sm">{order.deliveryNotes}</p>
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  <h3 className="text-lg font-semibold">Billing Address</h3>
                </div>
                {order.billingAddress && (
                  <button
                    onClick={() => handleCopyAddress(order.billingAddress!)}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
              {order.billingAddress ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.billingAddress.fullName}</p>
                  <p>{order.billingAddress.addressLine1}</p>
                  {order.billingAddress.addressLine2 && <p>{order.billingAddress.addressLine2}</p>}
                  <p>{order.billingAddress.city}, {order.billingAddress.province} {order.billingAddress.postalCode}</p>
                  <p>{order.billingAddress.country}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Same as shipping address</p>
              )}
            </div>
          </div>

          {/* Ordered Items */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-lg font-semibold">Order Items</h3>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    <p className="text-sm text-muted-foreground">{item.variant}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="font-medium">R{item.unitPrice} each</p>
                  </div>
                  <div className="text-right font-semibold min-w-20">
                    R{item.lineTotal}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600 dark:text-green-400">-R{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (VAT 15%)</span>
                <span>R{order.tax}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>R{order.shipping}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Grand Total</span>
                <span className="text-pink-600 dark:text-pink-400">R{order.total}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-lg font-semibold">Order Timeline</h3>
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
                    <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {order.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('processing')}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm"
                >
                  Mark as Processing
                </button>
              )}
              {order.status === 'processing' && (
                <button
                  onClick={() => handleStatusChange('shipped')}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm"
                >
                  Mark as Shipped
                </button>
              )}
              {(order.status === 'processing' || order.status === 'shipped') && (
                <button
                  onClick={() => setShowTrackingInput(!showTrackingInput)}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm"
                >
                  {order.trackingNumber ? 'Update' : 'Add'} Tracking Number
                </button>
              )}
              <button
                onClick={handleDownloadInvoice}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </button>
              <button
                onClick={() => alert('Resend confirmation email - Connect to C# backend')}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Resend Confirmation
              </button>
              {order.status !== 'refunded' && order.status !== 'cancelled' && (
                <>
                  <button
                    onClick={handleIssueRefund}
                    className="px-4 py-2 border border-orange-300 dark:border-orange-700 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm text-orange-600 dark:text-orange-400"
                  >
                    <RotateCcw className="h-4 w-4 inline-block mr-1" />
                    Issue Refund
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600 dark:text-red-400"
                  >
                    <XCircle className="h-4 w-4 inline-block mr-1" />
                    Cancel Order
                  </button>
                </>
              )}
            </div>

            {/* Tracking Number Input */}
            {showTrackingInput && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                <label className="block text-sm font-medium mb-2">Tracking Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                  />
                  <button
                    type='button'
                    onClick={handleUpdateTracking}
                    className="px-4 py-2 rounded-md text-white text-sm transition-all hover:opacity-90"
                    style={{
                      background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowTrackingInput(false)}
                    className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes & Communication */}
          <div className="bg-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-lg font-semibold">Order Notes</h3>
            </div>

            {/* Existing Notes */}
            {order.notes.length > 0 && (
              <div className="space-y-3 mb-4">
                {order.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg border ${
                      note.internal 
                        ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' 
                        : 'bg-muted/50 border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{note.author}</p>
                        {note.internal && (
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{note.timestamp}</p>
                    </div>
                    <p className="text-sm">{note.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Note */}
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an internal note about this order..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
              <button
                type='button'
                onClick={handleAddNote}
                className="px-4 py-2 rounded-md text-white text-sm transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                }}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}