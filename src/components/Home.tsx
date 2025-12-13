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

  const isRestaurantClosed = (restName: string) => {
    const rest = restaurants.find(r => r.name === restName);
    return rest ? !rest.is_open : false;
  };

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
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32 font-sans">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent cursor-pointer" onClick={() => { setSelectedRestaurant(null); setSearchQuery(''); }}>Unicart</h1>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button onClick={() => onNavigate('admin')} className="p-2 text-[#c4ff00] hover:bg-black/5 rounded-xl border border-gray-200 transition-colors">
                    <Lock className="w-4 h-4 text-gray-700" />
                  </button>
                )}
                {recentOrderIds.length > 0 && (
                  <button onClick={() => onNavigate('tracking')} className="bg-white text-gray-900 px-3 py-2 rounded-xl font-semibold border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition-all shadow-sm">
                    <ClipboardList className="w-4 h-4 text-[#c4ff00]" />
                    <span className="text-xs">History</span>
                  </button>
                )}
                <SignedOut><SignInButton mode="modal"><button className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform">Sign In</button></SignInButton></SignedOut>
                <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
                <button onClick={() => onNavigate('cart')} className="relative bg-[#c4ff00] text-black w-10 h-10 rounded-xl flex items-center justify-center font-bold hover:scale-105 transition-transform shadow-lg shadow-[#c4ff00]/20">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-bold">{totalItems}</span>}
                </button>
              </div>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#c4ff00] transition-colors" />
              <input type="text" placeholder="Search food or restaurants..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if(selectedRestaurant) setSelectedRestaurant(null); }} className="w-full bg-white text-gray-900 rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 border border-gray-200 focus:border-[#c4ff00]/20 transition-all placeholder-gray-400 shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>}
            </div>
          </div>
        </header>

        {selectedRestaurant ? (
          <div className="px-5 py-6 animate-in slide-in-from-right duration-300">
            <button onClick={() => setSelectedRestaurant(null)} className="flex items-center gap-2 text-gray-600 mb-6 hover:opacity-80 font-medium"><ArrowLeft className="w-5 h-5" /> Back</button>
            <div className="bg-white p-6 rounded-3xl mb-6 text-center border border-gray-100 shadow-xl">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100"><Store className="w-7 h-7 text-[#c4ff00]" /></div>
              <h2 className="text-2xl font-bold mb-1 text-gray-900">{selectedRestaurant}</h2>
              {isRestaurantClosed(selectedRestaurant) ? (
                <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full text-xs border border-red-100">Currently Closed</span>
              ) : (
                <p className="text-gray-500 text-sm">Full Menu</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {displayedItems.map((item) => (
                <MenuItemCard key={item.id} item={item} isClosed={isRestaurantClosed(item.restaurant_name)} onClick={() => setViewingItem(item)} onRestaurantClick={(name) => setSelectedRestaurant(name)}/>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="px-5 py-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Search Results</h2>
            {matchingRestaurants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Restaurants</h3>
                <div className="space-y-3">
                  {matchingRestaurants.map(restName => {
                    const isClosed = isRestaurantClosed(restName);
                    return (
                      <button key={restName} onClick={() => { setSelectedRestaurant(restName); setSearchQuery(''); }} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 hover:bg-gray-50 transition-all text-left border border-gray-100 shadow-sm active:scale-98">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><Store className="w-6 h-6 text-[#c4ff00]" /></div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{restName}</p>
                          <p className={`text-xs ${isClosed ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{isClosed ? 'Closed' : 'View Menu'}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Items</h3>
              <div className="grid grid-cols-2 gap-4">
                {displayedItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} isClosed={isRestaurantClosed(item.restaurant_name)} onClick={() => setViewingItem(item)} onRestaurantClick={(name) => { setSelectedRestaurant(name); setSearchQuery(''); }}/>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <HeroBannerCarousel />
            <div className="px-5 py-6">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-900">Categories</h2></div>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <button onClick={() => setSelectedCategory('All')} className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all font-bold text-sm ${selectedCategory === 'All' ? 'bg-[#c4ff00] text-black shadow-lg shadow-[#c4ff00]/20' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>All</button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all font-bold text-sm ${selectedCategory === cat.name ? 'bg-[#c4ff00] text-black shadow-lg shadow-[#c4ff00]/20' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>
                    <span>{cat.icon}</span><span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {recommendedItems.length > 0 && selectedCategory === 'All' && (
              <div className="px-5 pb-6">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Recommended</h2>
                <div className="grid grid-cols-2 gap-4">
                  {recommendedItems.slice(0, 4).map((item) => (
                    <MenuItemCard key={item.id} item={item} isClosed={isRestaurantClosed(item.restaurant_name)} onClick={() => setViewingItem(item)} onRestaurantClick={(name) => setSelectedRestaurant(name)}/>
                  ))}
                </div>
              </div>
            )}
            <div className="px-5">
              <h2 className="text-lg font-bold mb-4 text-gray-900">{selectedCategory === 'All' ? 'All Items' : selectedCategory}</h2>
              <div className="grid grid-cols-2 gap-4 pb-20">
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
