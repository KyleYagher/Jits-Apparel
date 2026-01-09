import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroCarousel } from '../components/HeroCarousel';
import { ProductCard } from '../components/ProductCard';
import { ProductDetail } from '../components/ProductDetail';
import { SplashScreen } from '../components/SplashScreen';
import { apiClient, Product as ApiProduct, CarouselItem } from '../services/api';
import { Product } from '../../types/types';
import '../App.css';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredApiProducts, setFeaturedApiProducts] = useState<ApiProduct[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  // Fetch carousel items from the API
  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        setLoadingCarousel(true);
        const items = await apiClient.getCarouselItems();
        setCarouselItems(items);
      } catch (error) {
        console.error('Error fetching carousel items:', error);
        // If error, carousel will use hardcoded defaults
      } finally {
        setLoadingCarousel(false);
      }
    };

    fetchCarouselItems();
  }, []);

  // Fetch featured products from the API
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoadingFeatured(true);
        const allProducts = await apiClient.getProducts();
        // Filter for featured products
        const featuredFromApi = allProducts.filter(p => p.isFeatured);
        setFeaturedApiProducts(featuredFromApi);
        // Map to the Product type for ProductCard
        const featured = featuredFromApi.map(apiProduct => mapApiProductToProduct(apiProduct));
        setFeaturedProducts(featured);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Map API Product to local Product type
  const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id.toString(),
      name: apiProduct.name,
      price: apiProduct.price,
      description: apiProduct.description || '',
      image: apiProduct.imageUrl || '',
      category: apiProduct.category?.name || 'Uncategorized',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'], // Default sizes
      colors: ['Black', 'White', 'Navy'], // Default colors
      featured: apiProduct.isFeatured,
    };
  };

  return (
    <>
      {/* Hero Section */}
      <section className="justify-items-center-safe">
        <HeroCarousel
          slides={!loadingCarousel ? carouselItems : undefined}
          onShopClick={() => navigate('shop')}
        />
      </section>

      {/* Featured Products - Only show if there are featured products */}
      {loadingFeatured ? (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <SplashScreen mode="inline" show={true} message="Loading featured products..." size="md" minHeight="300px" />
          </div>
        </section>
      ) : featuredProducts.length > 0 ? (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="mb-4">Featured Collection</h2>
              <p className="text-muted-foreground">
                Our most popular designs that everyone's talking about
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(featuredApiProducts[index])}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

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