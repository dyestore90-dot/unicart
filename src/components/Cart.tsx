import { useState, useEffect } from 'react';
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

  const name = user?.fullName || user?.firstName || '';
  const phone = user?.primaryPhoneNumber?.phoneNumber || '';
  const deliveryAddress = 'SSN CAMPUS IIIT ONGOLE';
  const collectionPoint = 'College Campus Gate';

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!name || !phone) {
      alert('Please ensure your profile has your name and phone number');
      return;
    }

    setLoading(true);

    try {
      const { data: batch } = await supabase
        .from('order_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!batch) {
        alert('No active delivery slot found');
        return;
      }

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          batch_id: batch.id,
          user_name: name,
          hostel: deliveryAddress,
          room: collectionPoint,
          phone,
          items: cart,
          total_amount: totalAmount,
          payment_mode: 'Pay on delivery',
        })
        .select()
        .single();

      if (error) throw error;

      onNavigate('confirmation', order.id);
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
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some delicious items to get started</p>
            <button
              onClick={() => onNavigate('home')}
              className="bg-[#c4ff00] text-black font-semibold px-8 py-3 rounded-xl"
            >
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
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="px-5 py-6">
          <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="bg-[#1a1a1a] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-[#c4ff00] font-bold">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#252525] rounded-xl px-3 py-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#c4ff00]/20 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#c4ff00]/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <SignedOut>
            <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-xl font-bold mb-2">Sign in to place your order</h2>
              <p className="text-gray-400 mb-6">You need to be logged in to complete your purchase</p>
              <SignInButton mode="modal">
                <button className="bg-[#c4ff00] text-black font-semibold px-8 py-4 rounded-xl hover:bg-[#b3e600] transition-all transform hover:scale-[1.02]">
                  Sign In to Continue
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-8">
              <h2 className="font-semibold mb-4">Delivery Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Name</label>
                  <div className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 text-gray-300">
                    {name || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                  <div className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 text-gray-300">
                    {phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Delivery Address</label>
                  <div className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 text-gray-300">
                    {deliveryAddress}
                  </div>
                </div>
                <div className="bg-[#c4ff00]/10 border border-[#c4ff00]/30 rounded-xl px-4 py-3">
                  <p className="text-sm text-[#c4ff00] font-semibold">Collection Point: {collectionPoint}</p>
                </div>
              </div>
            </div>
          </SignedIn>

          <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
              <span className="text-gray-400">Delivery</span>
              <span className="text-[#c4ff00]">Free</span>
            </div>
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-400 text-center">
              💵 Pay on delivery (UPI / Cash)
            </p>
          </div>

          <SignedIn>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-[#c4ff00] text-black font-semibold py-4 rounded-2xl hover:bg-[#b3e600] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
