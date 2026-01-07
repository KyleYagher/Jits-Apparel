import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/useCart';

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const [orderComplete, setOrderComplete] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setOrderComplete(true);
      clearCart();
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--jits-cyan)' }}>
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="mb-4">Order Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your order! We'll send you a confirmation email shortly.
          </p>
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
                    className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 rounded-lg border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
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

                <button
                  type="submit"
                  className="w-full py-4 rounded-lg text-white transition-all hover:opacity-90 mt-6"
                  style={{ 
                    background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                  }}
                >
                  Complete Order
                </button>
              </form>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 text-sm text-muted-foreground">
              <p>
                <strong>Note:</strong> This is a demo checkout. No actual payment will be processed.
                In production, integrate a payment provider like PayFast or Stripe.
              </p>
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
                  <span>Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-lg">Total</span>
                  <span className="text-2xl" style={{ color: 'var(--jits-pink)' }}>
                    R{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}