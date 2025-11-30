import { useState } from 'react';
import { Package, Radio, Menu, Image, Grid, Store } from 'lucide-react';
import { AdminOrders } from './AdminOrders';
import { AdminTracking } from './AdminTracking';
import { AdminMenu } from './AdminMenu';
import { AdminHeroBanners } from './AdminHeroBanners';
import { AdminCategories } from './AdminCategories';
import { AdminRestaurants } from './AdminRestaurants'; // Import the new component

export function Admin() {
  const [activeTab, setActiveTab] = useState<'orders' | 'tracking' | 'menu' | 'banners' | 'categories' | 'restaurants'>('orders');

  const tabs = [
    { id: 'orders' as const, label: 'Orders', icon: Package },
    { id: 'tracking' as const, label: 'Tracking', icon: Radio },
    { id: 'menu' as const, label: 'Menu', icon: Menu },
    { id: 'categories' as const, label: 'Cats', icon: Grid },
    { id: 'restaurants' as const, label: 'Rest.', icon: Store }, // The new tab
    { id: 'banners' as const, label: 'Banners', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="px-5 py-6">
            <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#c4ff00] text-black'
                        : 'bg-[#1a1a1a] text-white hover:bg-[#252525]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-6">
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'tracking' && <AdminTracking />}
          {activeTab === 'menu' && <AdminMenu />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'restaurants' && <AdminRestaurants />} {/* Show the component */}
          {activeTab === 'banners' && <AdminHeroBanners />}
        </div>
      </div>
    </div>
  );
}
