import { useEffect, useState } from 'react';
import { Store, Power, PowerOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Restaurant } from '../lib/database.types';

export function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (restaurant: Restaurant) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_open: !restaurant.is_open })
        .eq('id', restaurant.id);

      if (error) throw error;
      loadRestaurants();
    } catch (error) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800 mb-6">
        <h2 className="font-semibold text-white mb-2">Manage Restaurants</h2>
        <p className="text-sm text-gray-400">
          Turn off a restaurant to disable ordering for all its items instantly.
        </p>
      </div>

      <div className="grid gap-3">
        {restaurants.map((rest) => (
          <div 
            key={rest.id} 
            className={`bg-[#1a1a1a] p-4 rounded-xl flex items-center justify-between border transition-colors ${
              rest.is_open ? 'border-transparent' : 'border-red-900/50 bg-red-950/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                rest.is_open ? 'bg-[#252525] text-white' : 'bg-red-900/20 text-red-500'
              }`}>
                <Store size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{rest.name}</h3>
                <p className={`text-xs font-bold ${rest.is_open ? 'text-[#c4ff00]' : 'text-red-500'}`}>
                  {rest.is_open ? '● OPEN' : '● CLOSED'}
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleStatus(rest)}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                rest.is_open 
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                  : 'bg-[#c4ff00] text-black hover:bg-[#b3e600]'
              }`}
            >
              {rest.is_open ? <><PowerOff size={16} /> Close</> : <><Power size={16} /> Open</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
