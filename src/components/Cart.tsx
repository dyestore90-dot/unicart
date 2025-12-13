import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, MapPin, Phone, Home } from 'lucide-react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

interface CartProps {
  onNavigate: (screen: string, orderId?: string) => void;
}

export function Cart({ onNavigate }: CartProps) {
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart, addActiveOrder } = useCart();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Smart Address State
  const [phone, setPhone] = useState('');
  const [hostel, setHostel] = useState('SSN CAMPUS IIIT ONGOLE');
  const [room, setRoom] = useState('');

  const ORDER_CHARGE = 30;
  const finalTotal = totalAmount + ORDER_CHARGE;

  useEffect(() => {
    if (user) {
      const fetchLastOrderDetails = async () => {
        const { data } = await supabase
          .from('orders')
          .select('phone, hostel, room')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          if (data.phone) setPhone(data.phone);
          if (data.hostel) setHostel(data.hostel);
          if (data.room) setRoom(data.room);
          toast.success('Address auto-filled from last order!', { id: 'autofill', duration: 2000 });
        }
      };
      fetchLastOrderDetails();
    }
  }, [user]);

  const generateUniqueId = () => {
    const timeComponent = Date.now().toString().slice(-4);
    const randomComponent = Math.random().toString(36).substr(2, 2).toUpperCase();
    return `ORD-${timeComponent}-${randomComponent}`;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty 🛒');
      return;
    }
    if (!phone || !room || !hostel) {
      toast.error('Please fill in all delivery details');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Placing your order...');

    try {
      const { data: batch, error: batchError } = await supabase
        .from('order_batches')
        .select('id, is_active, slot_label')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (batchError || !batch) {
        toast.error('No active delivery slot found.', { id: toastId });
        setLoading(false);
        return;
      }
      if (!batch.is_active) {
        toast.error(`Orders CLOSED for "${batch.slot_label}"`, { id: toastId });
        setLoading(false);
        return;
      }
      const customOrderId = generateUniqueId();
      const { error } = await supabase
        .from('orders')
        .insert({
          id: customOrderId,
          batch_id: batch.id,
          user_id: user?.id || null,
          user_name: user?.fullName || user?.firstName || 'Guest',
          hostel: hostel,
          room: room,
          phone: phone,
          items: cart,
          total_amount: finalTotal,
          payment_mode: 'Pay on delivery',
        });

      if (error) throw error;
      addActiveOrder(customOrderId);
      clearCart();
      toast.success('Order Placed Successfully! 🎉', { id: toastId });
      onNavigate('confirmation', customOrderId);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 px-5 py-6">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-black">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">Cart Empty</h2>
          <button onClick={() => onNavigate('home')} className="bg-[#c4ff00] text-black font-semibold px-8 py-3 rounded-xl mt-4">Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-5 py-6">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-500 hover:text-black">
            <ArrowLeft className="w-5 h-5" /><span>Back</span>
          </button>
        </div>

        <div className="px-5 py-6">
          <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

          {/* Cart Items */}
          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-gray-900">{item.name}</h3>
                    <p className="text-black font-bold">₹{item.price}</p>
                  </div>
                  <button onClick={() => { removeFromCart(item.id); toast.success('Removed item'); }} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-4 h-4" /></button>
                  <span className="font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <SignedOut>
            <div className="bg-white p-8 rounded-2xl text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 mb-4">Sign in to place your order</p>
              <SignInButton mode="modal">
                <button className="bg-[#c4ff00] text-black font-semibold px-8 py-3 rounded-xl">Sign In</button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {/* Delivery Address Section */}
            <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-200 shadow-sm">
              <h2 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#c4ff00]" /> Delivery Details
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500">Ordering as</p>
                  <p className="font-semibold">{user?.fullName || user?.firstName}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 border border-gray-200 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Home className="w-3 h-3"/> Hostel / Block *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. SSN Campus Block A"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    className="w-full bg-white text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 border border-gray-200 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1">Room No / Landmark *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Room 304 or Main Gate"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full bg-white text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 border border-gray-200 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Bill Details Section */}
            <div className="bg-white p-5 rounded-2xl mb-6 space-y-3 border border-gray-200 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Bill Details</h2>
              
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Item Total</span>
                <span>₹{totalAmount}</span>
              </div>
              
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Delivery Partner Fee</span>
                <span>₹{ORDER_CHARGE}</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                <span className="font-semibold text-gray-900">To Pay</span>
                <span className="text-2xl font-bold text-black">₹{finalTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-[#c4ff00] text-black font-bold py-4 rounded-2xl hover:bg-[#b3e600] transition-all transform hover:scale-[1.02] disabled:opacity-50 shadow-lg shadow-[#c4ff00]/20"
            >
              {loading ? 'Placing Order...' : `Place Order (COD) • ₹${finalTotal}`}
            </button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
