import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, MenuItem } from '../lib/database.types';

interface CartContextType {
  cart: CartItem[];
  activeOrderId: string | null;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setOrderAsActive: (orderId: string) => void; // New helper
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // 1. Initialize Cart from Local Storage (Fixes "Empty Cart on Refresh")
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('unicart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. Initialize Active Order from Local Storage (Fixes "Lost Tracking")
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    return localStorage.getItem('unicart_active_order_id');
  });

  // 3. Auto-Save Cart whenever it changes
  useEffect(() => {
    localStorage.setItem('unicart_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // 4. Helper to Save Order ID when we place an order
  const setOrderAsActive = (orderId: string) => {
    setActiveOrderId(orderId);
    localStorage.setItem('unicart_active_order_id', orderId);
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ 
        cart, 
        activeOrderId, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        setOrderAsActive, 
        totalAmount, 
        totalItems 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
