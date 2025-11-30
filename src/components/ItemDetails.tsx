import { ArrowLeft, Plus, Minus, Store } from 'lucide-react';
import type { MenuItem } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { MenuItemCard } from './MenuItemCard';

interface ItemDetailsProps {
  item: MenuItem;
  allItems: MenuItem[];
  onClose: () => void;
  onItemClick: (item: MenuItem) => void;
}

export function ItemDetails({ item, allItems, onClose, onItemClick }: ItemDetailsProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find((ci) => ci.id === item.id);
  const quantity = cartItem?.quantity || 0;

  // Filter related items: Same category, but NOT the current item
  const relatedItems = allItems
    .filter(i => i.category === item.category && i.id !== item.id)
    .slice(0, 4);

  return (
    // 1. Outer Backdrop: Centers the "mobile screen" on desktop
    <div className="fixed inset-0 z-50 flex justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* 2. The "Mobile Screen" Container */}
      <div className="relative w-full max-w-md h-full bg-black text-white shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* 3. Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          
          {/* Header Image */}
          <div className="relative h-72 w-full bg-[#252525]">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl opacity-50">
                {item.category === 'Biryani' && '🍛'}
                {item.category === 'Chinese' && '🥡'}
                {item.category === 'Snacks' && '🍟'}
                {item.category === 'Drinks' && '🥤'}
              </div>
            )}
            
            {/* Back Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors z-10"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="p-5 pb-32">
            {/* Item Info */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold mb-2 leading-tight">{item.name}</h1>
                  {item.restaurant_name && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Store className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.restaurant_name}</span>
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-[#c4ff00]">₹{item.price}</p>
              </div>
              
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {item.description || "No description available for this delicious item."}
                </p>
              </div>
            </div>

            {/* Related Items Section */}
            {relatedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  You might also like
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {relatedItems.map(related => (
                    <MenuItemCard 
                      key={related.id} 
                      item={related} 
                      onClick={() => onItemClick(related)} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Bottom Action Bar (Stays inside the mobile container) */}
        <div className="bg-[#1a1a1a] border-t border-gray-800 p-5 pb-8 z-20">
          {quantity === 0 ? (
            <button
              onClick={() => addToCart(item)}
              className="w-full bg-[#c4ff00] text-black font-bold py-3.5 rounded-xl hover:bg-[#b3e600] transition-transform active:scale-95 text-lg shadow-lg shadow-[#c4ff00]/20"
            >
              Add to Cart - ₹{item.price}
            </button>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <span className="text-gray-400 text-sm font-normal">Total:</span>
                <span>₹{item.price * quantity}</span>
              </div>
              <div className="flex items-center bg-[#c4ff00] text-black rounded-xl px-2 py-1.5 gap-4 shadow-lg shadow-[#c4ff00]/10">
                <button 
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-10 h-10 flex items-center justify-center bg-black/10 rounded-lg hover:bg-black/20"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold text-xl min-w-[24px] text-center">{quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-black/10 rounded-lg hover:bg-black/20"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
