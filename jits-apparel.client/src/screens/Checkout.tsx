import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Loader2, Truck, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { apiClient, type Order, type CreateOrderRequest, type ShippingRate, type ShippingRatesResponse } from '../services/api';
import { toast } from 'sonner';

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [orderComplete, setOrderComplete] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });

  // Shipping state
  const [shippingRates, setShippingRates] = useState<ShippingRatesResponse | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Check if address is complete enough to fetch rates
  const isAddressComplete = formData.address && formData.city && formData.province && formData.postalCode;

  // Fetch shipping rates when address is complete
  const fetchShippingRates = useCallback(async () => {
    if (!isAddressComplete) return;

    setIsLoadingRates(true);
    setRatesError(null);

    try {
      const response = await apiClient.getShippingRates({
        deliveryAddress: {
          fullName: formData.fullName || 'Customer',
          addressLine1: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: 'South Africa',
          phone: formData.phone,
          email: formData.email
        },
        declaredValue: cartTotal
      });

      setShippingRates(response);

      // Auto-select first rate if none selected
      if (response.rates.length > 0 && !selectedRate) {
        setSelectedRate(response.rates[0]);
      }
    } catch {
      setRatesError('Unable to calculate shipping rates. Please verify your address.');
      setShippingRates(null);
    } finally {
      setIsLoadingRates(false);
    }
  }, [isAddressComplete, formData, cartTotal, selectedRate]);

  // Debounce address changes before fetching rates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAddressComplete) {
        fetchShippingRates();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.address, formData.city, formData.province, formData.postalCode, fetchShippingRates, isAddressComplete]);

  // Calculate total with shipping
  const shippingCost = shippingRates?.freeShippingAvailable ? 0 : (selectedRate?.totalRate ?? 0);
  const orderTotal = cartTotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!isAuthenticated) {
      toast.error('Please log in to complete your order');
      navigate('/login?redirect=/checkout');
      return;
    }

    // Check cart is not empty
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check shipping rate is selected (unless free shipping)
    if (!shippingRates?.freeShippingAvailable && !selectedRate) {
      toast.error('Please select a shipping method');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the order request
      const orderRequest: CreateOrderRequest = {
        items: cart.map(item => ({
          productId: parseInt(item.product.id, 10),
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color || undefined
        })),
        shippingAddress: {
          fullName: formData.fullName,
          addressLine1: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: 'South Africa',
          phone: formData.phone,
          email: formData.email
        },
        // Include shipping option selected at checkout
        serviceLevelCode: shippingRates?.freeShippingAvailable ? 'FREE' : selectedRate?.serviceLevelCode,
        serviceLevelName: shippingRates?.freeShippingAvailable ? 'Free Standard Shipping' : selectedRate?.serviceLevelName,
        shippingCost: shippingCost,
        deliveryEstimate: shippingRates?.freeShippingAvailable ? '3-5 business days' : selectedRate?.deliveryEstimate
      };

      const order = await apiClient.createOrder(orderRequest);
      setCreatedOrder(order);
      setOrderComplete(true);
      clearCart();
      toast.success(`Order ${order.orderNumber} placed successfully!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset shipping rates when address changes
    if (['address', 'city', 'province', 'postalCode'].includes(name)) {
      setSelectedRate(null);
    }
  };

  if (orderComplete && createdOrder) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--jits-cyan)' }}>
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="mb-4">Order Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Thank you for your order! We'll send you a confirmation email shortly.
          </p>
          <p className="text-xl font-mono mb-8 px-4 py-2 bg-muted rounded-lg inline-block">
            Order #{createdOrder.orderNumber}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="px-8 py-3 rounded-lg border border-primary text-primary transition-all hover:bg-primary/10"
            >
              View My Orders
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="px-8 py-3 rounded-lg text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="mb-4">Checkout</h1>
          <p className="text-muted-foreground mb-8">
            Please log in to complete your order.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login?redirect=/checkout')}
            className="px-8 py-3 rounded-lg text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
            }}
          >
            Log In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </button>

        <h1 className="mb-8">Checkout</h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="px-6 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
              }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="mb-6">Contact Information</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      placeholder="+27 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        placeholder="0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2">Province</label>
                    <select
                      name="province"
                      title='Province'
                      value={formData.province}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
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

                  {/* Shipping Options Section */}
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Shipping Method
                    </h3>

                    {!isAddressComplete ? (
                      <p className="text-sm text-muted-foreground">
                        Enter your delivery address to see shipping options.
                      </p>
                    ) : isLoadingRates ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculating shipping rates...
                      </div>
                    ) : ratesError ? (
                      <div className="text-sm text-red-500">
                        {ratesError}
                        <button
                          type="button"
                          onClick={fetchShippingRates}
                          className="ml-2 text-primary underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : shippingRates ? (
                      <div className="space-y-3">
                        {/* Free Shipping Banner */}
                        {shippingRates.freeShippingAvailable ? (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              <span className="font-medium">Free Shipping Applied!</span>
                            </div>
                            <p className="text-sm mt-1 opacity-80">
                              Your order qualifies for free standard shipping.
                            </p>
                          </div>
                        ) : shippingRates.amountToFreeShipping > 0 && (
                          <div className="p-3 rounded-lg bg-muted text-sm">
                            Add <span className="font-semibold">R{shippingRates.amountToFreeShipping.toFixed(2)}</span> more for free shipping!
                          </div>
                        )}

                        {/* Shipping Options */}
                        {!shippingRates.freeShippingAvailable && shippingRates.rates.map((rate) => (
                          <label
                            key={rate.serviceLevelCode}
                            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedRate?.serviceLevelCode === rate.serviceLevelCode
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="shippingRate"
                              value={rate.serviceLevelCode}
                              checked={selectedRate?.serviceLevelCode === rate.serviceLevelCode}
                              onChange={() => setSelectedRate(rate)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium">{rate.serviceLevelName}</span>
                                  <p className="text-sm text-muted-foreground">
                                    {rate.deliveryEstimate}
                                  </p>
                                </div>
                                <span className="font-semibold" style={{ color: 'var(--jits-pink)' }}>
                                  R{rate.totalRate.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}

                        {shippingRates.freeShippingAvailable && (
                          <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">Standard Shipping</span>
                                <p className="text-sm text-muted-foreground">3-5 business days</p>
                              </div>
                              <span className="font-semibold text-green-600 dark:text-green-400">FREE</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || (!shippingRates?.freeShippingAvailable && !selectedRate)}
                    className="w-full py-4 rounded-lg text-white transition-all hover:opacity-90 mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      'Complete Order'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-card rounded-lg border p-6 sticky top-24">
                <h2 className="mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cart.map((item, index) => (
                    <div key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm mb-1 line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {item.size} • {item.color} • Qty: {item.quantity}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--jits-pink)' }}>
                          R{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    {shippingRates?.freeShippingAvailable ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">FREE</span>
                    ) : selectedRate ? (
                      <span>R{selectedRate.totalRate.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-lg">Total</span>
                    <span className="text-2xl" style={{ color: 'var(--jits-pink)' }}>
                      R{orderTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shipping Info */}
                {selectedRate && !shippingRates?.freeShippingAvailable && (
                  <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">{selectedRate.serviceLevelName}</span>
                    </div>
                    <p className="text-muted-foreground">
                      Estimated delivery: {selectedRate.deliveryEstimate}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
