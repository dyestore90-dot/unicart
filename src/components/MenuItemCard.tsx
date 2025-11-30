import { Plus, Minus, Store, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { MenuItem } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
  isClosed?: boolean;
  onClick?: () => void;
  onRestaurantClick?: (restaurantName: string) => void;
}

export function MenuItemCard({ item, isClosed = false, onClick, onRestaurantClick }: MenuItemCardProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find((ci) => ci.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(item);
    toast.success(`Added ${item.name}`, {
      duration: 1500,
      icon: '🛒',
      style: { fontSize: '12px', padding: '8px', borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  return (
    <div 
      onClick={onClick}
      className={`relative bg-[#1a1a1a] rounded-3xl overflow-hidden flex flex-col h-full border border-gray-800/50 shadow-xl ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-100' : ''} ${isClosed ? 'opacity-75 grayscale-[0.5]' : ''}`}
    >
      {/* Image Area */}
      <div className="aspect-[4/3] bg-[#252525] relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-800 to-gray-900">
            {item.category === 'Biryani' && '🍛'}
            {item.category === 'Chinese' && '🥡'}
            {item.category === 'Snacks' && '🍟'}
            {item.category === 'Drinks' && '🥤'}
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60"></div>

        {item.is_recommended && !isClosed && (
          <div className="absolute top-3 left-3 bg-[#c4ff00]/90 backdrop-blur-sm text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-[#c4ff00]/50">
            Recommended
          </div>
        )}
        {isClosed && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">Closed</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 relative">
        {item.restaurant_name && (
          <div 
            onClick={(e) => { if (onRestaurantClick) { e.stopPropagation(); onRestaurantClick(item.restaurant_name); } }}
            className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 mb-1.5 bg-gray-800/50 w-fit px-2 py-0.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Store className="w-3 h-3" /><span className="truncate max-w-[100px]">{item.restaurant_name}</span>
          </div>
        )}

        <h3 className="font-bold text-white mb-1 line-clamp-2 leading-tight text-[15px]">{item.name}</h3>
        
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <p className="text-[#c4ff00] font-bold text-lg">₹{item.price}</p>

          {isClosed ? (
            <button disabled className="bg-[#252525] text-gray-500 p-2 rounded-xl cursor-not-allowed">
              <Lock className="w-5 h-5" />
            </button>
          ) : quantity === 0 ? (
            <button 
              onClick={handleAdd} 
              className="bg-[#c4ff00] text-black font-bold px-4 py-2 rounded-xl shadow-lg shadow-[#c4ff00]/10 text-sm active:scale-95 transition-transform"
            >
              Add
            </button>
          ) : (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center bg-[#252525] text-white rounded-xl border border-gray-700 overflow-hidden">
              <button onClick={() => updateQuantity(item.id, quantity - 1)} className="p-2 hover:text-[#c4ff00] transition-colors active:bg-white/10"><Minus className="w-4 h-4" /></button>
              <span className="font-bold text-sm w-4 text-center">{quantity}</span>
              <button onClick={() => updateQuantity(item.id, quantity + 1)} className="p-2 hover:text-[#c4ff00] transition-colors active:bg-white/10"><Plus className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
