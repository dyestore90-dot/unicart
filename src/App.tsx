import { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import { Home } from './components/Home';
import { Cart } from './components/Cart';
import { OrderConfirmation } from './components/OrderConfirmation';
import { OrderTracking } from './components/OrderTracking';
import { Admin } from './components/Admin';

function App() {
  const [screen, setScreen] = useState<'home' | 'cart' | 'confirmation' | 'tracking' | 'admin'>('home');
  const [orderId, setOrderId] = useState<string>('');

  const navigate = (newScreen: string, id?: string) => {
    setScreen(newScreen as typeof screen);
    if (id) setOrderId(id);
  };

  return (
    <CartProvider>
      {screen === 'home' && <Home onNavigate={navigate} />}
      {screen === 'cart' && <Cart onNavigate={navigate} />}
      {screen === 'confirmation' && <OrderConfirmation orderId={orderId} onNavigate={navigate} />}
      {screen === 'tracking' && <OrderTracking onNavigate={navigate} />}
      
      {/* Admin Screen is only shown if navigated to explicitly via the Home component */}
      {screen === 'admin' && <Admin />}
    </CartProvider>
  );
}

export default App;
