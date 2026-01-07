import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroCarousel } from '../components/HeroCarousel';
import { ProductCard } from '../components/ProductCard';
import { ProductDetail } from '../components/ProductDetail';
import { ApiTest } from '../components/ApiTest';
import { products } from '../../data/products';
import { Product } from '../../types/types';
import '../App.css';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const featuredProducts = products.filter(p => p.featured);
  // // Success notification
  // toast.success('Item added to cart!');

  // // Error notification
  // toast.error('Failed to process payment');

  // // Info notification
  // toast.info('Your order is being prepared');

  // // Warning notification
  // toast.warning('Low stock remaining');

  // // Loading notification
  // toast.loading('Processing...');

  // // Promise notification (auto-updates based on promise state)
  // toast.promise(fetchData(), {
  //   loading: 'Loading...',
  //   success: 'Data loaded!',
  //   error: 'Failed to load data'
  // });

  // // Custom notification with actions
  // toast('Order placed', {
  //   description: 'Your order #12345 has been confirmed',
  //   action: {
  //     label: 'View',
  //     onClick: () => console.log('View order')
  //   }
  // });

  return (
    <>

      
      {/* Hero Section */}
      <section 
        className="py-5 justify-items-center-safe"
        style={{ 
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)'
        }}
      >
        <HeroCarousel
          onShopClick={() => navigate('shop')}
        />
        
      </section>

      {/* API Integration Test */}
      <section className="py-8 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <ApiTest />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Featured Collection</h2>
            <p className="text-muted-foreground">
              Our most popular designs that everyone's talking about
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--jits-pink)', color: 'white' }}>
                ✨
              </div>
              <h3>Premium Quality</h3>
              <p className="text-sm text-muted-foreground">
                100% cotton, locally designed and printed
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--jits-orange)', color: 'white' }}>
                🎨
              </div>
              <h3>Unique Designs</h3>
              <p className="text-sm text-muted-foreground">
                Fresh, funky graphics inspired by SA culture
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--jits-cyan)', color: 'white' }}>
                🚚
              </div>
              <h3>Free Shipping</h3>
              <p className="text-sm text-muted-foreground">
                Nationwide delivery on all orders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}

// function fetchData(): Promise<unknown> | (() => Promise<unknown>) {
//   return new Promise((resolve) => {
//     setTimeout(() => resolve({ data: 'Sample data' }), 2000);
//   });
// }
