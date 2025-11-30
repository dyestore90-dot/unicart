import { useEffect, useState } from 'react';
import { ArrowLeft, Package, ChefHat, Bike, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

interface OrderTrackingProps {
  onNavigate: (screen: string) => void;
}

const steps = [
  { id: 1, label: 'Order Placed', icon: Clock },
  { id: 2, label: 'Order Accepted', icon: Package },
  { id: 3, label: 'Preparing Food', icon: ChefHat },
  { id: 4, label: 'Out for Delivery', icon: Bike },
  { id: 5, label: 'Delivered', icon: CheckCircle },
];

export function OrderTracking({ onNavigate }: OrderTrackingProps) {
  const { recentOrderIds } = useCart();
  
  // State to manage list vs single view
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Data for single view
  const [currentStep, setCurrentStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState('Loading status...');
  const [orderAmount, setOrderAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  // Data for list view (summary of all orders)
  const [ordersSummary, setOrdersSummary] = useState<any[]>([]);

  // If there is only one order, select it automatically
  useEffect(() => {
    if (recentOrderIds.length === 1) {
      setSelectedOrderId(recentOrderIds[0]);
    } else {
      fetchAllOrdersSummary();
    }
  }, [recentOrderIds]);

  // Poll for updates on the SELECTED order
  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderStatus();
      const interval = setInterval(fetchOrderStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedOrderId]);

  // Fetch summary for list view
  const fetchAllOrdersSummary = async () => {
    if (recentOrderIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, items')
        .in('id', recentOrderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrdersSummary(data || []);
    } catch (err) {
      console.error("Error fetching summaries:", err);
    }
  };

  const fetchOrderStatus = async () => {
    if (!selectedOrderId) return;

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          total_amount,
          items,
          batch_id,
          order_batches (
            current_step,
            status_message
          )
        `)
        .eq('id', selectedOrderId)
        .single();

      if (error) throw error;

      if (order && order.order_batches) {
        // @ts-ignore
        const batch = order.order_batches; 
        
        setCurrentStep(batch.current_step);
        setStatusMessage(batch.status_message);
        setOrderAmount(order.total_amount);
        
        const items = order.items as any[];
        const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setItemCount(count);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    }
  };

  // --- RENDER: EMPTY STATE ---
  if (recentOrderIds.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-5 text-center">
        <div>
          <p className="text-gray-400 mb-4">No active orders found.</p>
          <button onClick={() => onNavigate('home')} className="bg-[#c4ff00] text-black px-6 py-2 rounded-xl font-bold">
            Start Ordering
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: LIST VIEW (If multiple orders and none selected) ---
  if (!selectedOrderId) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-md mx-auto px-5 py-6">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-400 mb-6">
            <ArrowLeft className="w-5 h-5" /><span>Back to Home</span>
          </button>
          
          <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

          <div className="space-y-4">
            {ordersSummary.map((order) => {
              const items = order.items as any[];
              const firstItemName = items[0]?.name || 'Unknown Item';
              const moreItems = items.length > 1 ? `+${items.length - 1} more` : '';

              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full bg-[#1a1a1a] p-4 rounded-2xl flex items-center justify-between hover:bg-[#252525] transition-colors text-left"
                >
                  <div>
                    <p className="font-bold text-[#c4ff00] mb-1">Order #{order.id.slice(-4)}</p>
                    <p className="text-sm text-white font-medium">{firstItemName} {moreItems}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                  <ChevronRight className="text-gray-500" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: TRACKING VIEW (Single Order) ---
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-5 py-6">
          <button 
            onClick={() => recentOrderIds.length > 1 ? setSelectedOrderId(null) : onNavigate('home')} 
            className="flex items-center gap-2 text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{recentOrderIds.length > 1 ? 'Back to Orders' : 'Back'}</span>
          </button>
        </div>

        <div className="px-5 py-8">
          <h1 className="text-2xl font-bold mb-2">Order Tracking</h1>
          <p className="text-[#c4ff00] font-mono text-lg mb-8">ID: {selectedOrderId}</p>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8">
            <div className="relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                  <div key={step.id} className="relative">
                    <div className="flex items-start gap-4 pb-8 last:pb-0">
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-[#c4ff00] text-black' : isCurrent ? 'bg-[#c4ff00] text-black ring-4 ring-[#c4ff00]/20' : 'bg-[#252525] text-gray-400'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        {index < steps.length - 1 && <div className={`absolute top-12 left-6 w-0.5 h-8 transition-colors ${isCompleted ? 'bg-[#c4ff00]' : 'bg-[#252525]'}`} />}
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 className={`font-semibold mb-1 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-400'}`}>{step.label}</h3>
                        {isCurrent && <p className="text-sm text-[#c4ff00] animate-pulse">{statusMessage}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Total Amount</span>
              <span className="font-bold">₹{orderAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Items</span>
              <span>{itemCount} items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
