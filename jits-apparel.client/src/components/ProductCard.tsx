import { Product } from '../../types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-card rounded-lg overflow-hidden border border-gray-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1">{product.name}</h3>
          {product.featured && (
            <span 
              className="px-2 py-0.5 rounded-full text-white text-xs flex-shrink-0"
              style={{ backgroundColor: 'var(--jits-pink)' }}
            >
              Featured
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg" style={{ color: 'var(--jits-pink)' }}>
            R{product.price}
          </span>
          <span className="text-xs text-muted-foreground">
            {product.category}
          </span>
        </div>
      </div>
    </div>
  );
}
