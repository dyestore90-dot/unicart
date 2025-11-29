import { useEffect, useState } from 'react';
import { CheckCircle, Copy } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface OrderConfirmationProps {
  orderId: string;
  onNavigate: (screen: string) => void;
}

export function OrderConfirmation({ orderId, onNavigate }: OrderConfirmationProps) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-[#c4ff00] rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-black" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">Order Placed!</h1>
        <p className="text-gray-400 mb-8">
          Your order has been successfully placed.
        </p>

        {/* Short Order ID Display */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-gray-800">
          <p className="text-sm text-gray-400 mb-2">Your Order ID</p>
          <div className="text-3xl font-mono font-bold text-[#c4ff00] tracking-wider mb-2">
            {orderId}
          </div>
          <p className="text-xs text-gray-500">
            Show this ID at the College Campus Gate to collect your food.
          </p>
        </div>

        <button
          onClick={() => onNavigate('tracking')}
          className="w-full bg-[#c4ff00] text-black font-semibold py-4 rounded-2xl hover:bg-[#b3e600] transition-all transform hover:scale-[1.02] mb-4"
        >
          Track Order
        </button>

        <button
          onClick={() => onNavigate('home')}
          className="w-full bg-[#1a1a1a] text-white font-semibold py-4 rounded-2xl hover:bg-[#252525] transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
