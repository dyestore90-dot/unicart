import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

interface CartProps {
  onNavigate: (screen: string, orderId?: string) => void;
}

export function Cart({ onNavigate }: CartProps) {
  const { cart, updateQuantity, removeFromCart, totalAmount } = useCart();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // State for manual phone input (if Clerk doesn't have it)
  const [manualPhone, setManualPhone] = useState('');

  // 1. Get the best available phone number
  // If Clerk has it, use it. Otherwise, use what the user typed.
  const verifiedPhone = user?.primaryPhoneNumber?.phoneNumber;
  const finalPhoneNumber = verifiedPhone || manualPhone;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // 2. Validate Phone Number
    if (!finalPhoneNumber) {
      alert('Please enter your phone number so we can contact you for delivery.');
      return;
    }

    setLoading(true);

    // 3. Generate a Unique Short Order ID
    // Creates an ID like: "ORD-7X2M"
    const shortOrderId = 'ORD-' + Math.random().toString(36).substr(2, 4).toUpperCase();

    // Simulate API call (since we removed the DB connection)
    setTimeout(() => {
      // Navigate to confirmation with the new Short ID
      onNavigate('confirmation', shortOrderId);
      setLoading(false);
    }, 1500);
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
            <p className="text-gray-400 mb-6">Add some delicious items to get started</p>
            <button onClick={() => onNavigate('home')} className="bg-[#c4ff00] text-black font-semibold px-8 py-3 rounded-xl">
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

          {/* Cart Items */}
          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="bg-[#1a1a1a] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-[#c4ff00] font-bold">₹{item.price}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#252525] rounded-xl px-3 py-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-[#c4ff00]/20 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-[#c4ff00]/20 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <SignedOut>
            <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 text-center">
              <h2 className="text-xl font-bold mb-2">Sign in to place your order</h2>
              <SignInButton mode="modal">
                <button className="bg-[#c4ff00] text-black font-semibold px-8 py-3 rounded-xl mt-4">Sign In</button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-8">
              <h2 className="font-semibold mb-4">Delivery Details</h2>
              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Name</label>
                  <div className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 text-gray-300">
                    {user?.fullName || user?.firstName || 'Guest'}
                  </div>
                </div>

                {/* Phone Field - Conditional Input */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone Number *</label>
                  {verifiedPhone ? (
                    // Case A: Clerk has the phone number (Display it)
                    <div className="w-full bg-[#252525] text-[#c4ff00] rounded-xl px-4 py-3 font-semibold flex justify-between items-center">
                      {verifiedPhone}
                      <span className="text-xs bg-[#c4ff00]/20 px-2 py-1 rounded">Verified</span>
                    </div>
                  ) : (
                    // Case B: No verified phone (Show Input)
                    <input 
                      type="tel" 
                      placeholder="Enter your mobile number"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 border border-gray-700"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Delivery Address</label>
                  <div className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 text-gray-300">
                    SSN CAMPUS IIIT ONGOLE
                  </div>
                </div>
                <div className="bg-[#c4ff00]/10 border border-[#c4ff00]/30 rounded-xl px-4 py-3">
                  <p className="text-sm text-[#c4ff00] font-semibold">Collection Point: College Campus Gate</p>
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
