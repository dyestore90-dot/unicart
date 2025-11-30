import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, MenuItem } from '../lib/database.types';

interface CartContextType {
  cart: CartItem[];
  recentOrderIds: string[]; // CHANGED: Now an array
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  addActiveOrder: (orderId: string) => void; // CHANGED: Function name
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // 1. Initialize Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('unicart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. Initialize Recent Orders (Array)
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('unicart_recent_orders');
    // Safety check to ensure it's an array
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : []; 
    } catch {
      return [];
    }
  });

  // 3. Auto-Save Cart
  useEffect(() => {
    localStorage.setItem('unicart_cart', JSON.stringify(cart));
  }, [cart]);

  // 4. Auto-Save Recent Orders
  useEffect(() => {
    localStorage.setItem('unicart_recent_orders', JSON.stringify(recentOrderIds));
  }, [recentOrderIds]);

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

  // Add a new order to the list (Newest first)
  const addActiveOrder = (orderId: string) => {
    setRecentOrderIds((prev) => [orderId, ...prev]);
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ 
        cart, 
        recentOrderIds, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        addActiveOrder, 
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
