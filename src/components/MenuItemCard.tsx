import { Plus, Minus, Store } from 'lucide-react';
import type { MenuItem } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
  onClick?: () => void;
  onRestaurantClick?: (restaurantName: string) => void; // NEW PROP
}

export function MenuItemCard({ item, onClick, onRestaurantClick }: MenuItemCardProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find((ci) => ci.id === item.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div 
      onClick={onClick}
      className={`bg-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col h-full border border-gray-800/50 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
    >
      {/* Image Area */}
      <div className="aspect-[4/3] bg-[#252525] relative">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {item.category === 'Biryani' && '🍛'}
            {item.category === 'Chinese' && '🥡'}
            {item.category === 'Snacks' && '🍟'}
            {item.category === 'Drinks' && '🥤'}
          </div>
        )}
        
        {item.is_recommended && (
          <div className="absolute top-2 left-2 bg-[#c4ff00] text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            Recommended
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Restaurant Name - NOW CLICKABLE */}
        {item.restaurant_name && (
          <div 
            onClick={(e) => {
              if (onRestaurantClick) {
                e.stopPropagation(); // Stop card click
                onRestaurantClick(item.restaurant_name);
              }
            }}
            className="flex items-center gap-1 text-xs text-gray-500 mb-1 hover:text-[#c4ff00] transition-colors w-fit cursor-pointer"
          >
            <Store className="w-3 h-3" />
            <span className="truncate">{item.restaurant_name}</span>
          </div>
        )}

        <h3 className="font-semibold text-white mb-1 line-clamp-2 leading-snug">{item.name}</h3>
        
        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2 mb-3">
             <p className="text-[#c4ff00] font-bold text-lg">₹{item.price}</p>
          </div>

          {quantity === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(item);
              }}
              className="w-full bg-[#c4ff00] text-black font-bold py-2.5 rounded-xl hover:bg-[#b3e600] transition-colors active:scale-95 transform"
            >
              Add
            </button>
          ) : (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between bg-[#c4ff00] text-black rounded-xl px-2 py-2"
            >
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-black/10 rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg">{quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-black/10 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
