import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { ShoppingCartDrawer } from './ShoppingCartDrawer';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);

  const handleNavigate = (page: string) => {
    const routes: Record<string, string> = {
      'home': '/',
      'shop': '/shop',
      'about': '/about',
      'theme': '/theme',
      'login': '/login',
      'profile': '/profile',
      'dashboard': '/dashboard'
    };
    navigate(routes[page] || '/');
  };

  // Determine current page from URL
  const getCurrentPage = () => {
    switch (location.pathname) {
      case '/': return 'home';
      case '/shop': return 'shop';
      case '/about': return 'about';
      case '/checkout': return 'checkout';
      case '/theme': return 'theme';
      case '/login': return 'login';
      default: return 'home';
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <Navigation 
        onNavigate={handleNavigate}
        currentPage={getCurrentPage()}
        onCartClick={() => setCartOpen(true)}
      />

      <Outlet />

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8 justify-items-center">
            <div className="space-y-3">
              <h4>Shop</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="cursor-pointer hover:text-foreground transition-colors">New Arrivals</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Best Sellers</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Sale</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4>Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="cursor-pointer hover:text-foreground transition-colors">Size Guide</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Shipping Info</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Returns</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4>Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p 
                  onClick={() => navigate('/about')}
                  className="cursor-pointer hover:text-foreground transition-colors"
                >
                  About Us
                </p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Contact</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Careers</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4>Connect</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="cursor-pointer hover:text-foreground transition-colors">Instagram</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Facebook</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">TikTok</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Jits Apparel. Jas Clothing all the time</p>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Drawer */}
      <ShoppingCartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          navigate('/checkout');
        }}
      />
    </div>
  );
}