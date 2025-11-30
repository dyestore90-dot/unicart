import { useState } from 'react';
import { Toaster } from 'react-hot-toast'; // Import Toaster
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
      {/* Configure the Toast Notification Style */}
      <Toaster 
        position="bottom-center" 
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid #333',
          },
          success: {
            iconTheme: {
              primary: '#c4ff00',
              secondary: 'black',
            },
          },
        }}
      />
      
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
