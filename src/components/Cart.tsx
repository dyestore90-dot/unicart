import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase'; // Using the REAL supabase now

interface CartProps {
  onNavigate: (screen: string, orderId?: string) => void;
}

export function Cart({ onNavigate }: CartProps) {
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [manualPhone, setManualPhone] = useState('');

  const verifiedPhone = user?.primaryPhoneNumber?.phoneNumber;
  const finalPhoneNumber = verifiedPhone || manualPhone;

  const generateUniqueId = () => {
    const timeComponent = Date.now().toString().slice(-4);
    const randomComponent = Math.random().toString(36).substr(2, 2).toUpperCase();
    return `ORD-${timeComponent}-${randomComponent}`;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    if (!finalPhoneNumber) return alert('Please enter phone number');

    setLoading(true);
    const orderId = generateUniqueId();

    try {
      // SEND ORDER TO CLOUD DATABASE
      const { error } = await supabase.from('orders').insert({
        id: orderId,
        user_name: user?.fullName || 'Guest',
        phone: finalPhoneNumber,
        hostel: 'SSN CAMPUS IIIT ONGOLE',
        room: 'College Campus Gate',
        items: cart,
        total_amount: totalAmount,
        status: 'placed'
      });

      if (error) throw error;

      clearCart();
      onNavigate('confirmation', orderId);
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-5 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold">Cart is empty</h2>
        <button onClick={() => onNavigate('home')} className="mt-4 text-[#c4ff00]">Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="sticky top-0 bg-black/95 p-5 border-b border-gray-800">
        <button onClick={() => onNavigate('home')} className="flex gap-2 text-gray-400">
          <ArrowLeft /> Back
        </button>
      </div>

      <div className="p-5">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <div key={item.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex justify-between">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-[#c4ff00]">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3 bg-[#252525] px-3 py-1 rounded-xl">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16}/></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16}/></button>
              </div>
            </div>
          ))}
        </div>

        <SignedOut>
          <div className="text-center p-8 bg-[#1a1a1a] rounded-2xl">
            <p className="mb-4">Login to order</p>
            <SignInButton mode="modal"><button className="bg-[#c4ff00] text-black px-6 py-2 rounded-xl">Login</button></SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="bg-[#1a1a1a] p-5 rounded-2xl mb-6 space-y-4">
            <h2 className="font-semibold text-[#c4ff00]">Delivery Details</h2>
            <div className="bg-[#252525] p-3 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-400">Ordering as</p>
              <p>{user?.fullName}</p>
            </div>
            
            {!verifiedPhone && (
              <input 
                type="tel" 
                placeholder="Phone Number" 
                value={manualPhone} 
                onChange={e => setManualPhone(e.target.value)}
                className="w-full bg-[#252525] p-3 rounded-xl border border-gray-700 focus:border-[#c4ff00]"
              />
            )}

            <div className="bg-[#2a2a2a] p-3 rounded-xl border border-[#c4ff00]/30 text-sm">
              📍 <strong>Collection:</strong> College Campus Gate
            </div>
          </div>

          <button 
            onClick={handlePlaceOrder} 
            disabled={loading}
            className="w-full bg-[#c4ff00] text-black font-bold py-4 rounded-2xl disabled:opacity-50"
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </SignedIn>
      </div>
    </div>
  );
}
