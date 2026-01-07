import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { JitsLogoText } from './JitsLogoText';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NavigationProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onCartClick: () => void;
}

export function Navigation({ onNavigate, currentPage, onCartClick }: NavigationProps) {
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'about', label: 'About' },
    { id: 'theme', label: 'Theme' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-gray-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            className="cursor-pointer shrink-0 hover:scale-105 transition-transform"
            onClick={() => onNavigate('home')}
          >
            <JitsLogoText scale={0.35} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {navItems.map(item => (
              <button
                type='button'
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-6 py-2.5 rounded-full transition-all ${
                  currentPage === item.id
                    ? 'text-white shadow-lg scale-105'
                    : 'text-foreground hover:bg-muted/50 hover:scale-105'
                }`}
                style={currentPage === item.id ? {
                  background: 'linear-gradient(90deg, #ec4899 0%, #f97316 100%)' // Use hex values directly
                } : {}}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle - Desktop only */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                      }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{
                        background: 'linear-gradient(135deg, var(--jits-pink) 0%, var(--jits-cyan) 100%)'
                      }}
                    >
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p>{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {user?.roles?.includes('Admin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onNavigate('dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                      logout();
                      onNavigate('home');
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => onNavigate('login')}
                  variant="outline"
                  className="gap-2 rounded-full"
              >
                <User className="w-4 h-4" />
                Sign In
              </Button>
            )}

            <button
              type='button'
              onClick={onCartClick}
              className="relative p-3 rounded-full transition-all hover:scale-110 hover:shadow-md"
              style={{ 
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
              }}
            >
              <ShoppingCart className="w-5 h-5" style={{ color: '#ec4899' }} /> {/* Use hex directly */}
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center shadow-lg animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-3 rounded-full transition-all hover:scale-110"
              style={{ 
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
              }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" style={{ color: 'var(--jits-pink)' }} /> : <Menu className="w-5 h-5" style={{ color: 'var(--jits-pink)' }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <div className="px-4 py-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
            {/* Theme Toggle - Mobile */}
            <div className="pt-4 border-t flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}