import { ArrowLeft, Plus, Minus, Store, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Import Motion
import type { MenuItem } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { MenuItemCard } from './MenuItemCard';

interface ItemDetailsProps {
  item: MenuItem;
  allItems: MenuItem[];
  onClose: () => void;
  onItemClick: (item: MenuItem) => void;
  isClosed?: boolean;
}

export function ItemDetails({ item, allItems, onClose, onItemClick, isClosed = false }: ItemDetailsProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find((ci) => ci.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const relatedItems = allItems.filter(i => i.category === item.category && i.id !== item.id).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center pointer-events-none">
      
      {/* Backdrop with Blur */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
      />

      {/* The Main Card - Physics Based Spring Animation */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md h-[90vh] bg-[#0a0a0a] text-white shadow-2xl flex flex-col rounded-t-[2rem] overflow-hidden pointer-events-auto border-t border-white/10"
      >
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="relative h-80 w-full">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className={`w-full h-full object-cover ${isClosed ? 'grayscale' : ''}`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-b from-gray-800 to-[#0a0a0a]">
                {item.category === 'Biryani' && '🍛'}
                {item.category === 'Chinese' && '🥡'}
                {item.category === 'Snacks' && '🍟'}
                {item.category === 'Drinks' && '🥤'}
              </div>
            )}
            
            {/* Gradient Fade for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0a0a0a]"></div>

            {isClosed && (
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                <span className="bg-red-500 text-white font-bold text-lg px-6 py-2 rounded-full uppercase tracking-wider shadow-xl transform -rotate-12 border-2 border-white">
                  Restaurant Closed
                </span>
              </div>
            )}

            <button onClick={onClose} className="absolute top-4 left-4 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-10 border border-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 pb-32 -mt-10 relative z-10">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-3xl font-extrabold mb-2 leading-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{item.name}</h1>
                  {item.restaurant_name && (
                    <div className="flex items-center gap-1.5 text-gray-400 bg-white/5 w-fit px-3 py-1 rounded-full">
                      <Store className="w-3.5 h-3.5" />
                      <span className="font-medium text-xs">{item.restaurant_name}</span>
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold text-[#c4ff00] drop-shadow-sm">₹{item.price}</p>
              </div>
              
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-light">
                  {item.description || "No description available for this delicious item."}
                </p>
              </div>
            </div>

            {relatedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">You might also like</h2>
                <div className="grid grid-cols-2 gap-3">
                  {relatedItems.map(related => (
                    <MenuItemCard key={related.id} item={related} onClick={() => onItemClick(related)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM BAR - Glassmorphism */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20 bg-gradient-to-t from-black via-black/95 to-transparent pt-10">
          {isClosed ? (
            <button disabled className="w-full bg-gray-800 text-gray-500 font-bold py-4 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" /> Restaurant Currently Closed
            </button>
          ) : quantity === 0 ? (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(item)} 
              className="w-full bg-[#c4ff00] text-black font-extrabold py-4 rounded-2xl hover:bg-[#b3e600] shadow-lg shadow-[#c4ff00]/20 text-lg"
            >
              Add to Cart - ₹{item.price}
            </motion.button>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <span className="text-gray-400 text-sm font-normal">Total:</span><span>₹{item.price * quantity}</span>
              </div>
              <div className="flex items-center bg-[#c4ff00] text-black rounded-2xl px-3 py-2 gap-5 shadow-lg shadow-[#c4ff00]/10">
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-black/10 rounded-xl hover:bg-black/20"><Minus className="w-5 h-5" /></motion.button>
                <span className="font-bold text-2xl min-w-[24px] text-center">{quantity}</span>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-black/10 rounded-xl hover:bg-black/20"><Plus className="w-5 h-5" /></motion.button>
              </div>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
