import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Store, Upload, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MenuItem, Category, Restaurant } from '../lib/database.types';

export function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Toggle for "Select" vs "Type New"
  const [isNewRestaurant, setIsNewRestaurant] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '', // Will default to first category later
    description: '',
    image_url: '',        
    restaurant_name: '',
    is_recommended: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Load Menu Items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });
      setMenuItems(menuData || []);

      // 2. Load Categories (Dynamic!)
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      setCategories(catData || []);
      
      // Set default category if form is empty
      if (catData && catData.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: catData[0].name }));
      }

      // 3. Load Restaurants (For Dropdown)
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');
      setRestaurants(restData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: data.publicUrl });
      
    } catch (error) {
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || !formData.restaurant_name) {
      alert('Please fill in all required fields');
      return;
    }

    const finalRestaurantName = formData.restaurant_name.trim();

    try {
      // --- AUTO-SAVE NEW RESTAURANT ---
      // If user typed a new name that isn't in our list, save it to 'restaurants' table
      const existingRest = restaurants.find(r => r.name.toLowerCase() === finalRestaurantName.toLowerCase());
      if (!existingRest) {
        await supabase.from('restaurants').insert({ name: finalRestaurantName, is_open: true });
        // Refresh list silently
        const { data: newRestList } = await supabase.from('restaurants').select('*').order('name');
        if (newRestList) setRestaurants(newRestList);
      }

      // --- SAVE MENU ITEM ---
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formData.name,
            price: Number(formData.price),
            category: formData.category,
            description: formData.description,
            image_url: formData.image_url,
            restaurant_name: finalRestaurantName,
            is_recommended: formData.is_recommended,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        alert('Item updated!');
      } else {
        const { error } = await supabase.from('menu_items').insert({
          name: formData.name,
          price: Number(formData.price),
          category: formData.category,
          description: formData.description,
          image_url: formData.image_url,
          restaurant_name: finalRestaurantName,
          is_recommended: formData.is_recommended,
          is_available: true,
        });

        if (error) throw error;
        alert('Item added!');
      }

      resetForm();
      loadData(); // Reload everything
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    loadData();
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || '',
      image_url: item.image_url || '',
      restaurant_name: item.restaurant_name || '',
      is_recommended: item.is_recommended,
    });
    setIsNewRestaurant(false); // Reset to dropdown mode
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: categories.length > 0 ? categories[0].name : '',
      description: '',
      image_url: '',
      restaurant_name: '',
      is_recommended: false,
    });
    setEditingItem(null);
    setShowAddForm(false);
    setIsNewRestaurant(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-[#c4ff00] text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#b3e600] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      )}

      {showAddForm && (
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="font-semibold mb-4 text-[#c4ff00]">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Price */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Item Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
                required
              />
              <input
                type="number"
                placeholder="Price *"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
                required
              />
            </div>

            {/* DYNAMIC Category & Restaurant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Category Dropdown (Dynamic now!) */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Smart Restaurant Selector */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block ml-1">Restaurant</label>
                
                {!isNewRestaurant ? (
                  // DROPDOWN MODE
                  <select
                    value={formData.restaurant_name}
                    onChange={(e) => {
                      if (e.target.value === '___NEW___') {
                        setIsNewRestaurant(true);
                        setFormData({ ...formData, restaurant_name: '' });
                      } else {
                        setFormData({ ...formData, restaurant_name: e.target.value });
                      }
                    }}
                    className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
                  >
                    <option value="">Select Restaurant...</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                    <option value="___NEW___" className="font-bold text-[#c4ff00] bg-gray-800">
                      + Add New Restaurant
                    </option>
                  </select>
                ) : (
                  // TEXT INPUT MODE
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Store className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Type new name..."
                        value={formData.restaurant_name}
                        onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                        className="w-full bg-[#252525] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20 border border-[#c4ff00]/30"
                        autoFocus
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsNewRestaurant(false)}
                      className="bg-[#252525] p-3 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Cancel adding new"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-[#252525] rounded-xl p-4 border border-dashed border-gray-700">
              <label className="block text-sm text-gray-400 mb-2">Item Image</label>
              {formData.image_url && (
                <div className="mb-3 w-full h-32 bg-black/50 rounded-lg overflow-hidden flex items-center justify-center relative group">
                   <img src={formData.image_url} alt="Preview" className="h-full object-contain" />
                   <button 
                      type="button"
                      onClick={() => {
                        setFormData({...formData, image_url: ''});
                        if(fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 p-1 rounded-full text-white"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                ref={fileInputRef}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#c4ff00] file:text-black cursor-pointer"
              />
            </div>

            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20 resize-none"
            />

            <label className="flex items-center gap-3 text-sm cursor-pointer bg-[#252525] p-3 rounded-xl">
              <input
                type="checkbox"
                checked={formData.is_recommended}
                onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                className="w-5 h-5 accent-[#c4ff00]"
              />
              <span>Mark as Recommended</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-[#c4ff00] text-black font-semibold py-3 rounded-xl hover:bg-[#b3e600] disabled:opacity-50"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-[#252525] text-white font-semibold py-3 rounded-xl hover:bg-[#333]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List View */}
      <div className="space-y-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-[#1a1a1a] rounded-2xl p-4 flex gap-4 border border-gray-800/50">
            <div className="w-20 h-20 bg-[#252525] rounded-xl flex-shrink-0 overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍛</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                  <p className="text-[#c4ff00] font-bold">₹{item.price}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(item)} className="p-2 hover:bg-[#252525] rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                 <span className="text-xs text-gray-400 bg-[#252525] px-2 py-0.5 rounded border border-gray-700">{item.category}</span>
                 {item.restaurant_name && (
                   <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 flex items-center gap-1">
                     <Store size={10} /> {item.restaurant_name}
                   </span>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
