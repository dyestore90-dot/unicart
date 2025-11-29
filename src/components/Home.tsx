import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Bike, Lock } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import type { MenuItem } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { MenuItemCard } from './MenuItemCard';
import { FloatingCartBar } from './FloatingCartBar';
import { HeroBannerCarousel } from './HeroBannerCarousel';

const categories = ['All', 'Biryani', 'Chinese', 'Snacks', 'Drinks'];
const categoryIcons: Record<string, string> = { Biryani: '🍛', Chinese: '🥡', Snacks: '🍟', Drinks: '🥤' };

// Define your Admin Email here
const ADMIN_EMAIL = "santgolla9@gmail.com";

const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Chicken Biryani', price: 180, category: 'Biryani', description: 'Aromatic basmati rice with tender chicken', image_url: '', is_available: true, is_recommended: true, created_at: '' },
  { id: '2', name: 'Veg Hakka Noodles', price: 120, category: 'Chinese', description: 'Stir-fried noodles', image_url: '', is_available: true, is_recommended: false, created_at: '' },
  { id: '3', name: 'Paneer Butter Masala', price: 160, category: 'Biryani', description: 'Rich creamy curry', image_url: '', is_available: true, is_recommended: true, created_at: '' },
  { id: '4', name: 'Cold Coffee', price: 60, category: 'Drinks', description: 'Chilled creamy coffee', image_url: '', is_available: true, is_recommended: false, created_at: '' },
  { id: '5', name: 'French Fries', price: 90, category: 'Snacks', description: 'Crispy salted fries', image_url: '', is_available: true, is_recommended: false, created_at: '' }
];

export function Home({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const { totalItems, activeOrder } = useCart();
  const { user } = useUser(); // Get the current user details

  // Check if the current user is the Admin
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    setMenuItems(MOCK_MENU_ITEMS);
    setLoading(false);
  }, []);

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const recommendedItems = menuItems.filter((item) => item.is_recommended);

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Unicart</h1>
              <div className="flex items-center gap-3">
                
                {/* ADMIN BUTTON: Only visible if you are logged in with the correct email */}
                {isAdmin && (
                  <button 
                    onClick={() => onNavigate('admin')}
                    className="p-2 text-[#c4ff00] hover:bg-[#c4ff00]/10 rounded-xl transition-colors border border-[#c4ff00]/50"
                    title="Open Admin Panel"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                )}

                {/* Tracking Button */}
                {activeOrder && (
                  <button
                    onClick={() => onNavigate('tracking')}
                    className="bg-[#252525] text-[#c4ff00] p-2 rounded-xl hover:bg-[#333] transition-colors border border-[#c4ff00]/20"
                    title="Track Order"
                  >
                    <Bike className="w-5 h-5" />
                  </button>
                )}

                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#252525] transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <button
                  onClick={() => onNavigate('cart')}
                  className="relative bg-[#c4ff00] text-black w-12 h-12 rounded-2xl flex items-center justify-center font-semibold"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-[#c4ff00] text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for something tasty..."
                className="w-full bg-[#1a1a1a] text-white rounded-2xl pl-12 pr-4 py-3.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
              />
            </div>
          </div>
        </header>

        <HeroBannerCarousel />
        
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top Categories</h2>
            <button className="text-sm text-gray-400 flex items-center gap-1">View all →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#c4ff00] text-black font-semibold'
                    : 'bg-[#1a1a1a] text-white hover:bg-[#252525]'
                }`}
              >
                {category !== 'All' && <span>{categoryIcons[category]}</span>}
                <span>{category}</span>
              </button>
            ))}
          </div>
        </div>

        {recommendedItems.length > 0 && selectedCategory === 'All' && (
          <div className="px-5 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recommended for you</h2>
              <button className="text-sm text-gray-400 flex items-center gap-1">View all →</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recommendedItems.slice(0, 4).map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        <div className="px-5">
          <h2 className="text-lg font-semibold mb-4">
            {selectedCategory === 'All' ? 'All Items' : selectedCategory}
          </h2>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading menu...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No items found</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
      <FloatingCartBar onNavigate={onNavigate} />
    </div>
  );
}
