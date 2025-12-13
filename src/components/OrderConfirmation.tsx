import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { OrderBatch } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';

interface OrderConfirmationProps {
  orderId: string;
  onNavigate: (screen: string) => void;
}

export function OrderConfirmation({ orderId, onNavigate }: OrderConfirmationProps) {
  const [batch, setBatch] = useState<OrderBatch | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    loadBatchInfo();
  }, []);

  const loadBatchInfo = async () => {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('batch_id')
        .eq('id', orderId)
        .maybeSingle();

      if (order?.batch_id) {
        const { data } = await supabase
          .from('order_batches')
          .select('*')
          .eq('id', order.batch_id)
          .maybeSingle();

        if (data) setBatch(data);
      }
    } catch (error) {
      console.error('Error loading batch:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-[#c4ff00] rounded-full flex items-center justify-center shadow-lg shadow-[#c4ff00]/20">
            <CheckCircle className="w-12 h-12 text-black" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3 text-gray-900">Order Placed!</h1>
        <p className="text-gray-500 mb-8">
          Your order has been successfully placed
        </p>

        {/* ORDER ID DISPLAY */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-sm text-gray-400 mb-1">Your Order ID</p>
          <p className="text-2xl font-mono font-bold text-black tracking-wider">{orderId}</p>
          <p className="text-xs text-gray-500 mt-2">Show this ID at the collection point</p>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-400 mb-2">Delivery Slot</p>
          <p className="text-xl font-semibold mb-4 text-gray-900">{batch?.slot_label || 'Loading...'}</p>
          <p className="text-sm text-gray-500">
            All orders in this slot will be delivered together
          </p>
        </div>

        <button
          onClick={() => onNavigate('tracking')}
          className="w-full bg-[#c4ff00] text-black font-semibold py-4 rounded-2xl hover:bg-[#b3e600] transition-all transform hover:scale-[1.02] mb-4 shadow-md"
        >
          Track Order
        </button>

        <button
          onClick={() => onNavigate('home')}
          className="w-full bg-white text-gray-900 font-semibold py-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
