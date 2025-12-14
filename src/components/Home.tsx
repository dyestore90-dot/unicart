import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Lock, ClipboardList, X, Store, ArrowLeft, Utensils, Leaf } from 'lucide-react';
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
  
  // NEW: Toggle between 'restaurant' and 'organic'
  const [activeSection, setActiveSection] = useState<'restaurant' | 'organic'>('restaurant');
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

  // Reset category when switching sections
  useEffect(() => {
    setSelectedCategory('All');
  }, [activeSection]);

  const loadData = async () => {
    try {
      // 1. Get Categories
      const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
      setCategories(catData || []);

      // 2. Get Restaurants
      const { data: restData } = await supabase.from('restaurants').select('*');
      setRestaurants(restData || []);

      // 3. Get Menu Items
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

  // --- FILTERING LOGIC ---
  
  // 1. Filter Categories based on Active Section (Restaurant vs Organic)
  // Note: Old categories might have null section, treat them as 'restaurant'
  const displayedCategories = categories.filter(cat => 
    (cat.section === activeSection) || (!cat.section && activeSection === 'restaurant')
  );

  // 2. Filter Items based on Section AND Category AND Search
  let displayedItems = menuItems.filter(item => {
     // Find the category object for this item to check its section
     const itemCat = categories.find(c => c.name === item.category);
     const itemSection = itemCat?.section || 'restaurant';
     return itemSection === activeSection;
  });

  let matchingRestaurants: string[] = [];

  if (selectedRestaurant) {
    displayedItems = displayedItems.filter(item => item.restaurant_name === selectedRestaurant);
  } else if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    // In search mode, search EVERYTHING, not just the active section
    displayedItems = menuItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      (item.restaurant_name && item.restaurant_name.toLowerCase().includes(lowerQuery)) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
    const allRestaurants = Array.from(new Set(menuItems.map(i => i.restaurant_name).filter(Boolean)));
    matchingRestaurants = allRestaurants.filter(r => r.toLowerCase().includes(lowerQuery));
  } else {
    // Standard Filter by Category
    if (selectedCategory !== 'All') {
      displayedItems = displayedItems.filter((item) => item.category === selectedCategory);
    }
  }

  const recommendedItems = displayedItems.filter((item) => item.is_recommended);

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
            
            {/* SEARCH BAR */}
            <div className="relative group mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#c4ff00] transition-colors" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if(selectedRestaurant) setSelectedRestaurant(null); }} className="w-full bg-white text-gray-900 rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 border border-gray-200 focus:border-[#c4ff00]/20 transition-all placeholder-gray-400 shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>}
            </div>

            {/* NEW: SECTION TOGGLE (Food vs Organic) */}
            {!selectedRestaurant && !searchQuery && (
              <div className="bg-gray-100 p-1 rounded-xl flex relative">
                <button 
                  onClick={() => setActiveSection('restaurant')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeSection === 'restaurant' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Utensils className="w-4 h-4" /> Food Delivery
                </button>
                <button 
                  onClick={() => setActiveSection('organic')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeSection === 'organic' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Leaf className="w-4 h-4" /> Organic Mart
                </button>
              </div>
            )}
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
            <div>
              <div className="grid grid-cols-2 gap-4">
                {displayedItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} isClosed={isRestaurantClosed(item.restaurant_name)} onClick={() => setViewingItem(item)} onRestaurantClick={(name) => { setSelectedRestaurant(name); setSearchQuery(''); }}/>
                ))}
              </div>
              {displayedItems.length === 0 && <p className="text-gray-500 text-center py-10">No items found.</p>}
            </div>
          </div>
        ) : (
          <>
            <HeroBannerCarousel />
            
            {/* CATEGORY BAR */}
            <div className="px-5 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {activeSection === 'restaurant' ? 'Eat what makes you happy' : 'Fresh & Organic Essentials'}
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <button onClick={() => setSelectedCategory('All')} className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all font-bold text-sm ${selectedCategory === 'All' ? 'bg-[#c4ff00] text-black shadow-lg shadow-[#c4ff00]/20' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>All</button>
                {displayedCategories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all font-bold text-sm ${selectedCategory === cat.name ? 'bg-[#c4ff00] text-black shadow-lg shadow-[#c4ff00]/20' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>
                    <span>{cat.icon}</span><span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ITEMS GRID */}
            <div className="px-5">
              <h2 className="text-lg font-bold mb-4 text-gray-900">{selectedCategory === 'All' ? 'All Items' : selectedCategory}</h2>
              <div className="grid grid-cols-2 gap-4 pb-20">
                {displayedItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} isClosed={isRestaurantClosed(item.restaurant_name)} onClick={() => setViewingItem(item)} onRestaurantClick={(name) => setSelectedRestaurant(name)}/>
                ))}
                {displayedItems.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400">
                    <p>No items found in {activeSection === 'restaurant' ? 'Menu' : 'Mart'}.</p>
                    {activeSection === 'organic' && <p className="text-sm mt-2">Add items to "Organic" categories in Admin!</p>}
                  </div>
                )}
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
