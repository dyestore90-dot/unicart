import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Lock, ClipboardList, X, Store, ArrowLeft } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import type { MenuItem, Category, Restaurant } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { MenuItemCard } from './MenuItemCard';
import { FloatingCartBar } from './FloatingCartBar';
import { HeroBannerCarousel } from './HeroBannerCarousel';
import { ItemDetails } from './ItemDetails';

const ADMIN_EMAIL = "santgolla9@gmail.com";

export function Home({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null);

  const { totalItems, recentOrderIds } = useCart();
  const { user } = useUser();

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
      setCategories(catData || []);

      const { data: restData } = await supabase.from('restaurants').select('*');
      setRestaurants(restData || []);

      const { data: itemData, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('is_recommended', { ascending: false });

      if (error) throw error;
      setMenuItems(itemData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if a restaurant is closed
  const isRestaurantClosed = (restName: string) => {
    const rest = restaurants.find(r => r.name === restName);
    return rest ? !rest.is_open : false; // Default to open if not found
  };

  // --- LOGIC: Filter Items based on State ---
  let displayedItems = menuItems;
  let matchingRestaurants: string[] = [];

  if (selectedRestaurant) {
    displayedItems = menuItems.filter(item => item.restaurant_name === selectedRestaurant);
  } else if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    displayedItems = menuItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      (item.restaurant_name && item.restaurant_name.toLowerCase().includes(lowerQuery)) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
    const allRestaurants = Array.from(new Set(menuItems.map(i => i.restaurant_name).filter(Boolean)));
    matchingRestaurants = allRestaurants.filter(r => r.toLowerCase().includes(lowerQuery));
  } else {
    displayedItems = selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);
  }

  const recommendedItems = menuItems.filter((item) => item.is_recommended);

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold" onClick={() => { setSelectedRestaurant(null); setSearchQuery(''); }}>Unicart</h1>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button onClick={() => onNavigate('admin')} className="p-2 text-[#c4ff00] hover:bg-[#c4ff00]/10 rounded-xl border border-[#c4ff00]/50">
                    <Lock className="w-4 h-4" />
                  </button>
                )}
                {recentOrderIds.length > 0 && (
                  <button onClick={() => onNavigate('tracking')} className="bg-[#252525] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 flex items-center gap-2 hover:bg-[#333]">
                    <ClipboardList className="w-4 h-4 text-[#c4ff00]" />
                    <span className="text-sm">My Orders</span>
                  </button>
                )}
                <SignedOut><SignInButton mode="modal"><button className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-semibold">Sign In</button></SignInButton></SignedOut>
                <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
                <button onClick={() => onNavigate('cart')} className="relative bg-[#c4ff00] text-black w-10 h-10 rounded-xl flex items-center justify-center font-semibold">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">{totalItems}</span>}
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if(selectedRestaurant) setSelectedRestaurant(null); }} className="w-full bg-[#1a1a1a] text-white rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>}
            </div>
          </div>
        </header>

        {/* RESTAURANT PAGE */}
        {selectedRestaurant ? (
          <div className="px-5 py-6 animate-in slide-in-from-right duration-300">
            <button onClick={() => setSelectedRestaurant(null)} className="flex items-center gap-2 text-[#c4ff00] mb-6 hover:opacity-80"><ArrowLeft className="w-5 h-5" /> Back to Home</button>
            
            <div className="bg-[#1a1a1a] p-6 rounded-2xl mb-6 text-center border border-gray-800">
              <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-3"><Store className="w-8 h-8 text-gray-400" /></div>
              <h2 className="text-2xl font-bold mb-1">{selectedRestaurant}</h2>
              {isRestaurantClosed(selectedRestaurant) ? (
                <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full text-sm">Currently Closed</span>
              ) : (
                <p className="text-gray-400 text-sm">All available items</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {displayedItems.map((item) => (
                <MenuItemCard 
                  key={item.id} 
                  item={item} 
                  isClosed={isRestaurantClosed(item.restaurant_name)} 
                  onClick={() => setViewingItem(item)} 
                  onRestaurantClick={(name) => setSelectedRestaurant(name)}
                />
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="px-5 py-6">
            <h2 className="text-lg font-semibold mb-4">Search Results</h2>
            {matchingRestaurants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-bold">Restaurants</h3>
                <div className="space-y-3">
                  {matchingRestaurants.map(restName => {
                    const isClosed = isRestaurantClosed(restName);
                    return (
                      <button key={restName} onClick={() => { setSelectedRestaurant(restName); setSearchQuery(''); }} className="w-full bg-[#1a1a1a] p-4 rounded-xl flex items-center gap-4 hover:bg-[#252525] transition-colors text-left border border-gray-800/50">
                        <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center"><Store className="w-6 h-6 text-[#c4ff00]" /></div>
                        <div>
                          <p className="font-bold text-lg">{restName}</p>
                          <p className={`text-xs ${isClosed ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{isClosed ? 'Closed Now' : 'View Menu'}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-bold">Items</h3>
              <div className="grid grid-cols-2 gap-4">
                {displayedItems.map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    isClosed={isRestaurantClosed(item.restaurant_name)} 
                    onClick={() => setViewingItem(item)} 
                    onRestaurantClick={(name) => { setSelectedRestaurant(name); setSearchQuery(''); }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <HeroBannerCarousel />
            <div className="px-5 py-6">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Top Categories</h2></div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${selectedCategory === 'All' ? 'bg-[#c4ff00] text-black font-semibold' : 'bg-[#1a1a1a] text-white'}`}>All</button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${selectedCategory === cat.name ? 'bg-[#c4ff00] text-black font-semibold' : 'bg-[#1a1a1a] text-white hover:bg-[#252525]'}`}>
                    <span>{cat.icon}</span><span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {recommendedItems.length > 0 && selectedCategory === 'All' && (
              <div className="px-5 pb-6">
                <h2 className="text-lg font-semibold mb-4">Recommended for you</h2>
                <div className="grid grid-cols-2 gap-4">
                  {recommendedItems.slice(0, 4).map((item) => (
                    <MenuItemCard key={item.id} item={item} isClosed={isRestaurantClosed(item.restaurant_name)} onClick={() => setViewingItem(item)} onRestaurantClick={(name) => setSelectedRestaurant(name)}/>
                  ))}
                </div>
              </div>
            )}
            <div className="px-5">
              <h2 className="text-lg font-semibold mb-4">{selectedCategory === 'All' ? 'All Items' : selectedCategory}</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* --- FIX: Changed 'filteredItems' to 'displayedItems' below --- */}
                {displayedItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} isClosed={isRestaurantClosed(item.restaurant_name)} onClick={() => setViewingItem(item)} onRestaurantClick={(name) => setSelectedRestaurant(name)}/>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {viewingItem && (
        <ItemDetails 
          item={viewingItem} 
          allItems={menuItems}
          onClose={() => setViewingItem(null)}
          onItemClick={(item) => setViewingItem(item)}
          isClosed={isRestaurantClosed(viewingItem.restaurant_name)} 
        />
      )}

      <FloatingCartBar onNavigate={onNavigate} />
    </div>
  );
}
