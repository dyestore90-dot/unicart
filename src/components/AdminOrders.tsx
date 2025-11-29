import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define the Order type manually since we aren't using the generated types file yet
type Order = {
  id: string;
  user_name: string;
  phone: string;
  total_amount: number;
  status: string;
  items: any[];
  created_at: string;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
    // Enable Real-time updates (Orders appear without refreshing!)
    const channel = supabase
      .channel('realtime orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => [payload.new as Order, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-bold mb-4">Live Orders ({orders.length})</h2>
      {orders.map((order) => (
        <div key={order.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800">
          <div className="flex justify-between mb-2">
            <h3 className="font-bold text-lg">{order.user_name}</h3>
            <span className="text-[#c4ff00] font-mono">{order.id}</span>
          </div>
          <div className="text-sm text-gray-400 mb-3 flex gap-4">
             <span>📞 {order.phone}</span>
             <span>💰 ₹{order.total_amount}</span>
          </div>
          <div className="border-t border-gray-700 pt-3">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm mb-1">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-gray-500">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
