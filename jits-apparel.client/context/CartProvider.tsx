import { useState, useEffect, ReactNode } from 'react';
import { CartContext } from './CartContext'
import { CartItem } from '../types';


export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('jits-cart');
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    });
  
    useEffect(() => {
      localStorage.setItem('jits-cart', JSON.stringify(cart));
    }, [cart]);
  
    const addToCart = (item: CartItem) => {
      setCart(prev => {
        const existing = prev.find(
          i => i.product.id === item.product.id && 
               i.size === item.size && 
               i.color === item.color
        );
  
        if (existing) {
          return prev.map(i =>
            i.product.id === item.product.id && 
            i.size === item.size && 
            i.color === item.color
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
  
        return [...prev, item];
      });
    };
  
    const removeFromCart = (productId: string, size: string, color: string) => {
      setCart(prev => prev.filter(
        i => !(i.product.id === productId && i.size === size && i.color === color)
      ));
    };
  
    const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId, size, color);
        return;
      }
  
      setCart(prev => prev.map(i =>
        i.product.id === productId && i.size === size && i.color === color
          ? { ...i, quantity }
          : i
      ));
    };
  
    const clearCart = () => {
      setCart([]);
    };
  
    const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
    return (
      <CartContext.Provider value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount
      }}>
        {children}
      </CartContext.Provider>
    );
}