import { X, Package, CreditCard, Truck, MapPin, User, Mail, Clock, CheckCircle, XCircle, Copy, Download, RotateCcw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { Order, apiClient, RefundRequest, StoreSettings } from '../services/api';
import { InvoicePDF } from './InvoicePDF';
import JitsLogoImage from '../assets/Jits_icon.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onOrderUpdate?: (updatedOrder: Order) => void;
}

export function OrderDetails({ order: initialOrder, onClose, onOrderUpdate }: OrderDetailsProps) {
  const [order, setOrder] = useState(initialOrder);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Fetch store settings for VAT calculation
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await apiClient.getAdminSettings();
        setStoreSettings(settings);
      } catch (error) {
        console.error('Failed to load store settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Loading states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [restoreStock, setRestoreStock] = useState(true);

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

  const handleCopyEmail = () => {
    try {
      navigator.clipboard.writeText(order.customerEmail);
      toast.success('Email copied to clipboard!');
    } catch {
      toast.error('Failed to copy email');
    }
  };

  const handleCopyAddress = () => {
    if (!order.shippingAddress) return;
    const addr = order.shippingAddress;
    const formatted = `${addr.fullName}\n${addr.addressLine1}${addr.addressLine2 ? '\n' + addr.addressLine2 : ''}\n${addr.city}, ${addr.province} ${addr.postalCode}\n${addr.country}`;
    try {
      navigator.clipboard.writeText(formatted);
      toast.success('Address copied to clipboard!');
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrder(updatedOrder);
    onOrderUpdate?.(updatedOrder);
  };

  const handleUpdateTracking = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const updatedOrder = await apiClient.updateOrderStatus(order.id, {
        status: order.status,
        trackingNumber: trackingNumber.trim()
      });
      handleUpdateOrder(updatedOrder);
      toast.success('Tracking number updated!');
      setShowTrackingInput(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update tracking number');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const updatedOrder = await apiClient.updateOrderStatus(order.id, {
        status: newStatus,
        trackingNumber: trackingNumber || undefined
      });
      handleUpdateOrder(updatedOrder);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Convert image to base64 for PDF embedding
  const getLogoBase64 = async (): Promise<string | undefined> => {
    try {
      const response = await fetch(JitsLogoImage);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    try {
      // Fetch invoice data from API
      const invoiceData = await apiClient.getOrderInvoice(order.id);

      // Get logo as base64 for PDF
      const logoBase64 = await getLogoBase64();

      // Generate PDF
      const pdfBlob = await pdf(
        <InvoicePDF invoice={invoiceData} logoBase64={logoBase64} />
      ).toBlob();

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceData.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsResendingConfirmation(true);
    try {
      const result = await apiClient.resendOrderConfirmation(order.id);
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend confirmation');
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handleIssueRefund = async () => {
    setIsProcessingRefund(true);
    try {
      const refundRequest: RefundRequest = {
        reason: refundReason || undefined,
        restoreStock: restoreStock
      };
      const updatedOrder = await apiClient.processRefund(order.id, refundRequest);
      handleUpdateOrder(updatedOrder);
      toast.success(`Refund of R${order.totalAmount.toFixed(2)} processed successfully`);
      setShowRefundDialog(false);
      setRefundReason('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const updatedOrder = await apiClient.updateOrderStatus(order.id, {
        status: 'Cancelled',
        adminNote: 'Order cancelled by admin'
      });
      handleUpdateOrder(updatedOrder);
      toast.success('Order cancelled successfully');
      setShowCancelDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  // Build variant string from size and color
  const getVariant = (item: Order['items'][0]) => {
    const parts = [];
    if (item.color) parts.push(item.color);
    if (item.size) parts.push(item.size);
    return parts.length > 0 ? parts.join(' / ') : 'Standard';
  };

  const isAnyActionLoading = isUpdatingStatus || isResendingConfirmation || isProcessingRefund || isDownloadingInvoice || isCancelling;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
          {/* Header - Sticky */}
          <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-mono">{order.orderNumber}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString('en-ZA', {
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
                type="button"
                title="Close"
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Order Summary - Top Overview */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">Total Amount</span>
                </div>
                <p className="text-2xl font-bold">R{order.totalAmount}</p>
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
                <p className="text-lg font-semibold">{order.shippingMethod || 'Standard'}</p>
                {order.trackingNumber && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{order.trackingNumber}</p>
                )}
              </div>
            </div>

            {/* Tracking Information - Only show if shipped/delivered */}
            {order.trackingNumber && isShippedOrDelivered && (
              <div
                className="rounded-lg p-4 border-2"
                style={{
                  borderColor: 'var(--jits-cyan)',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
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
            )}

            {/* Customer Information */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
                <h3 className="text-lg font-semibold">Customer Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${order.customerEmail}`} className="text-pink-600 dark:text-pink-400 hover:underline">
                      {order.customerEmail}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Copy email"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {order.customerPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
                    <h3 className="text-lg font-semibold">Shipping Address</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
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
              </div>
            )}

            {/* Order Items */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
                <h3 className="text-lg font-semibold">Order Items</h3>
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{getVariant(item)}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">R{item.unitPrice.toFixed(2)} each</p>
                      <p className="font-semibold">R{item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary with VAT */}
              <div className="mt-6 pt-4 border-t space-y-2">
                {(() => {
                  // Calculate values - VAT is included in item prices
                  const shippingCost = order.shippingCost || 0;
                  const totalWithShipping = order.totalAmount;
                  const itemsTotal = totalWithShipping - shippingCost;
                  const vatRate = storeSettings?.vatEnabled ? (storeSettings.vatRate / 100) : 0;
                  const subtotalExclVat = vatRate > 0 ? itemsTotal / (1 + vatRate) : itemsTotal;
                  const vatAmount = itemsTotal - subtotalExclVat;

                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Subtotal {vatRate > 0 ? '(excl. VAT)' : ''}
                        </span>
                        <span>R{subtotalExclVat.toFixed(2)}</span>
                      </div>
                      {vatRate > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">VAT ({storeSettings?.vatRate}%)</span>
                          <span>R{vatAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Shipping
                          {order.serviceLevelName && (
                            <span className="text-xs ml-1">({order.serviceLevelName})</span>
                          )}
                        </span>
                        {shippingCost > 0 ? (
                          <span>R{shippingCost.toFixed(2)}</span>
                        ) : (
                          <span className="text-green-600">Free</span>
                        )}
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Grand Total</span>
                        <span style={{ color: 'var(--jits-pink)' }}>R{totalWithShipping.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5" style={{ color: 'var(--jits-pink)' }} />
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

            {/* Quick Actions */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {statusLower === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Processing')}
                    disabled={isAnyActionLoading}
                    className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Mark as Processing
                  </button>
                )}
                {statusLower === 'processing' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Shipped')}
                    disabled={isAnyActionLoading}
                    className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Mark as Shipped
                  </button>
                )}
                {statusLower === 'shipped' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Delivered')}
                    disabled={isAnyActionLoading}
                    className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Mark as Delivered
                  </button>
                )}
                {(statusLower === 'processing' || statusLower === 'shipped') && (
                  <button
                    type="button"
                    onClick={() => setShowTrackingInput(!showTrackingInput)}
                    disabled={isAnyActionLoading}
                    className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {order.trackingNumber ? 'Update' : 'Add'} Tracking Number
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={isAnyActionLoading}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Invoice
                </button>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isAnyActionLoading}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResendingConfirmation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Resend Confirmation
                </button>
                {statusLower !== 'cancelled' && statusLower !== 'delivered' && order.paymentStatus !== 'Refunded' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRefundDialog(true)}
                      disabled={isAnyActionLoading}
                      className="px-4 py-2 border border-orange-300 dark:border-orange-700 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm text-orange-600 dark:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingRefund ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Issue Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isAnyActionLoading}
                      className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
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
                      type="button"
                      onClick={handleUpdateTracking}
                      disabled={isUpdatingStatus}
                      className="px-4 py-2 rounded-md text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{
                        background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                      }}
                    >
                      {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTrackingInput(false)}
                      className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-muted/50 rounded-lg p-4 border">
                <h4 className="font-semibold mb-2">Order Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order <span className="font-mono font-bold">{order.orderNumber}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue Refund</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Issue a full refund of <span className="font-bold">R{order.totalAmount.toFixed(2)}</span> for order{' '}
                  <span className="font-mono font-bold">{order.orderNumber}</span>?
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter refund reason"
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="restoreStock"
                    checked={restoreStock}
                    onChange={(e) => setRestoreStock(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="restoreStock" className="text-sm">
                    Restore stock and cancel order
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingRefund}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleIssueRefund}
              disabled={isProcessingRefund}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isProcessingRefund && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
