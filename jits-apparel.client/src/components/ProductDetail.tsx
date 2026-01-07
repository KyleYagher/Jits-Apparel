import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Product } from '../services/api';
import { useCart } from '../../context/useCart';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetail({ product, onClose }: ProductDetailProps) {
  const { addToCart } = useCart();
  // Default sizes and colors for database products
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Navy'];

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    // Convert API Product to cart-compatible format
    addToCart({
      product: {
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        description: product.description || '',
        image: product.imageUrl || '',
        category: product.category?.name || '',
        sizes: sizes,
        colors: colors,
      },
      quantity,
      size: selectedSize,
      color: selectedColor
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/800 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card relative rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-foreground">{product.name}</h2>
          
        </div>
        <button
          type='button'
          title='close'
          onClick={onClose}
          className="p-2 absolute top-0 right-0 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5 font-co" />
        </button>
        <div className="grid md:grid-cols-2 gap-8 p-6">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
            <ImageWithFallback
              src={product.imageUrl || ''}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Details */}
            <div className="pt-6 border-t border-border space-y-2 text-sm">
              <p className="text-foreground"><span className="text-muted-foreground">Category:</span> {product.category?.name || 'N/A'}</p>
              <p className="text-foreground"><span className="text-muted-foreground">Available Sizes:</span> {sizes.join(', ')}</p>
              <p className="text-foreground"><span className="text-muted-foreground">Available Colors:</span> {colors.join(', ')}</p>
              <p className="text-foreground"><span className="text-muted-foreground">Stock:</span> {product.stockQuantity} units</p>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-foreground">{product.name}</h1>
                {product.isActive && (
                  <span
                    className="px-3 py-1 rounded-full text-white text-sm shadow-lg"
                    style={{ backgroundColor: 'var(--jits-pink)' }}
                  >
                    Active
                  </span>
                )}
              </div>
              <p className="text-2xl mb-4" style={{ color: 'var(--jits-pink)' }}>
                R{product.price.toFixed(2)}
              </p>
              <p className="text-muted-foreground">{product.description || 'No description available'}</p>
            </div>

            {/* Size Selection */}
            <div>
              <label className="block mb-2 text-foreground">Size</label>
              <div className="flex gap-2 flex-wrap">
                {sizes.map(size => (
                  <button
                    type='button'
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedSize === size
                        ? 'text-white shadow-lg'
                        : 'border-border hover:border-primary bg-card text-foreground'
                    }`}
                    style={
                      selectedSize === size
                        ? {
                            borderColor: 'var(--jits-pink)',
                            background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)',
                          }
                        : {}
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block mb-2 text-foreground">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    type='button'
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? 'text-white shadow-lg'
                        : 'border-border hover:border-primary bg-card text-foreground'
                    }`}
                    style={
                      selectedColor === color
                        ? {
                            borderColor: 'var(--jits-orange)',
                            background: 'linear-gradient(90deg, var(--jits-orange) 0%, var(--jits-yellow) 100%)',
                          }
                        : {}
                    }
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block mb-2 text-foreground">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type='button'
                  title='decrease quantity'
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors bg-card"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-foreground">{quantity}</span>
                <button
                  type='button'
                  title='increase quantity'
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors bg-card"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              type='button'
              title='add to cart'
              onClick={handleAddToCart}
              className="w-full py-4 rounded-lg text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ 
                background: added 
                  ? 'linear-gradient(90deg, var(--jits-cyan) 0%, var(--jits-cyan-dark) 100%)' 
                  : 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
              }}
            >
              {added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>

            
          </div>
        </div>
      </div>
    </div>
  );
}