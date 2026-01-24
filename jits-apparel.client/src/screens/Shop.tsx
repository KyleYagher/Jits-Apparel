import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ProductDetail } from '../components/ProductDetail';
import { SplashScreen } from '../components/SplashScreen';
import { apiClient, Product as ApiProduct } from '../services/api';
import { Product } from '../../types/types';

export default function ShopScreen() {
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await apiClient.getProducts();
        setApiProducts(allProducts);
        // Map API products to local Product type for ProductCard
        const mapped = allProducts.map(mapApiProductToProduct);
        setProducts(mapped);
      } catch {
        // Silently fail - products will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id.toString(),
      name: apiProduct.name,
      price: apiProduct.price,
      description: apiProduct.description || '',
      image: apiProduct.imageUrl || '',
      category: apiProduct.category?.name || 'Uncategorized',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'White', 'Navy'],
      featured: apiProduct.isFeatured,
    };
  };

  return (
    <>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="mb-4">Shop All Designs</h1>
            <p className="text-muted-foreground">
              Explore our full collection of super cool t-shirts
            </p>
          </div>
          {loading ? (
            <SplashScreen mode="inline" show={true} message="Loading products..." size="md" minHeight="400px" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(apiProducts[index])}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}