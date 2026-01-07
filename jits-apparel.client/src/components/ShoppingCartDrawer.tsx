import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/useCart';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ShoppingCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function ShoppingCartDrawer({ isOpen, onClose, onCheckout }: ShoppingCartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-xl z-50 flex flex-col border-l border-border">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/95 backdrop-blur-sm">
          <h2 className="text-foreground">Shopping Cart ({cartCount})</h2>
          <button
            title='Close cart'
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add some Jits to your collection!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="flex gap-4 border-b border-border pb-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                    <ImageWithFallback
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="mb-1 line-clamp-1 text-foreground">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.size} • {item.color}
                    </p>
                    <p className="mb-2" style={{ color: 'var(--jits-pink)' }}>
                      R{item.product.price}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        title='Decrease quantity'
                        type='button'
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                        className="p-1 rounded border border-border hover:bg-muted transition-colors bg-card text-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-8 text-center text-foreground">{item.quantity}</span>
                      <button
                        title='Increase quantity'
                        type='button'
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                        className="p-1 rounded border border-border hover:bg-muted transition-colors bg-card text-foreground"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        title='Remove item'
                        type='button'
                        onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                        className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-border bg-card/95 backdrop-blur-sm px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg text-foreground">Total</span>
              <span className="text-2xl" style={{ color: 'var(--jits-pink)' }}>
                R{cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => {
                onCheckout();
                onClose();
              }}
              className="w-full py-4 rounded-lg text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ 
                background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}