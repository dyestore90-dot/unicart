import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

interface CartProps {
  onNavigate: (screen: string, orderId?: string) => void;
}

export function Cart({ onNavigate }: CartProps) {
  // IMPORTANT: We use 'setOrderAsActive' to save the ID to local storage
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart, setOrderAsActive } = useCart();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // State for manual phone input (used if Clerk doesn't have a verified number)
  const [manualPhone, setManualPhone] = useState('');

  // Priority: Verified Clerk Phone -> Manual Input
  const verifiedPhone = user?.primaryPhoneNumber?.phoneNumber;
  const finalPhoneNumber = verifiedPhone || manualPhone;

  // Generate a Short, Unique ID (e.g., ORD-4521-XY)
  const generateUniqueId = () => {
    const timeComponent = Date.now().toString().slice(-4);
    const randomComponent = Math.random().toString(36).substr(2, 2).toUpperCase();
    return `ORD-${timeComponent}-${randomComponent}`;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!finalPhoneNumber) {
      alert('Please enter your phone number so we can contact you.');
      return;
    }

    setLoading(true);

    try {
      // 1. Get the LATEST batch and check if it is ACTIVE
      // This prevents ordering when the shop is closed
      const { data: batch, error: batchError } = await supabase
        .from('order_batches')
        .select('id, is_active, slot_label')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (batchError || !batch) {
        alert('No active delivery slot found. Please ask admin to create a batch.');
        setLoading(false);
        return;
      }

      if (batch.is_active === false) {
        alert(`⚠️ Orders are currently CLOSED for "${batch.slot_label}".\n\nPlease wait for the next slot to open.`);
        setLoading(false);
        return;
      }

      // 2. Generate ID
      const customOrderId = generateUniqueId();

      // 3. Insert Order into Database
      const { error } = await supabase
        .from('orders')
        .insert({
          id: customOrderId,
          batch_id: batch.id,
          user_name: user?.fullName || user?.firstName || 'Guest',
          hostel: 'SSN CAMPUS IIIT ONGOLE',
          room: 'College Campus Gate',
          phone: finalPhoneNumber,
          items: cart,
          total_amount: totalAmount,
          payment_mode: 'Pay on delivery',
        });

      if (error) throw error;

      // 4. Save ID to Local Storage (via Context) & Clear Cart
      // This ensures the order doesn't "vanish" if you refresh
      setOrderAsActive(customOrderId);
      clearCart();
      
      onNavigate('confirmation', customOrderId);

    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-md mx-auto px-5 py-6">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-400 mb-6">
            <ArrowLeft className="w-5 h-5" /><span>Back</span>
          </button>
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <button onClick={() => onNavigate('home')} className="bg-[#c4ff00] text-black font-semibold px-8 py-3 rounded-xl mt-4">
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-5 py-6">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-400">
            <ArrowLeft className="w-5 h-5" /><span>Back</span>
          </button>
        </div>

        <div className="px-5 py-6">
          <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

          {/* Cart Items List */}
          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="bg-[#1a1a1a] rounded-2xl p-4">
                <div className="flex justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-[#c4ff00] font-bold">₹{item.price}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#252525] rounded-xl px-3 py-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-4 h-4" /></button>
                  <span className="font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <SignedOut>
            <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center">
              <p className="text-gray-400 mb-4">Sign in to place your order</p>
              <SignInButton mode="modal">
                <button className="bg-[#c4ff00] text-black font-semibold px-8 py-3 rounded-xl">Sign In</button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-8">
              <h2 className="font-semibold mb-4 text-[#c4ff00]">Delivery Details</h2>
              <div className="space-y-4">
                {/* User Name */}
                <div className="bg-[#252525] p-3 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-400">Ordering as</p>
                  <p className="font-semibold">{user?.fullName || user?.firstName}</p>
                </div>

                {/* Phone Number Logic */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone Number *</label>
                  {verifiedPhone ? (
                    <div className="w-full bg-[#252525] text-[#c4ff00] rounded-xl px-4 py-3 font-semibold flex justify-between items-center">
                      {verifiedPhone}
                      <span className="text-xs bg-[#c4ff00]/20 px-2 py-1 rounded">Verified</span>
                    </div>
                  ) : (
                    <input 
                      type="tel" 
                      placeholder="Enter your mobile number"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 border border-gray-700"
                    />
                  )}
                </div>

                {/* Address */}
                <div className="bg-[#252525] p-3 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-400">Delivery Address</p>
                  <p className="text-white">SSN CAMPUS IIIT ONGOLE</p>
                </div>
                
                {/* Collection Point */}
                <div className="bg-[#2a2a2a] border border-[#c4ff00]/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <p className="text-sm text-gray-300"><strong>Collection Point:</strong> College Campus Gate</p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-[#c4ff00] text-black font-semibold py-4 rounded-2xl hover:bg-[#b3e600] transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
