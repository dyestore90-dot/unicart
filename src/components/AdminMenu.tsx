import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Store, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MenuItem } from '../lib/database.types';

export function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // New state for handling file uploads
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Biryani',
    description: '',
    image_url: '',        
    restaurant_name: '',
    is_recommended: false,
  });

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Handle Image Upload ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage bucket named 'menu-images'
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get the Public URL
      const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath);
      
      // 3. Set it to form data
      setFormData({ ...formData, image_url: data.publicUrl });
      
    } catch (error) {
      alert('Error uploading image! Make sure you created a public bucket named "menu-images".');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const finalRestaurantName = formData.restaurant_name.trim() || 'UniCart Kitchen';

    try {
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
        alert('Item updated successfully!');
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
        alert('Item added successfully!');
      }

      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;
      loadMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);

      if (error) throw error;
      alert('Item deleted successfully!');
      loadMenuItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
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
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'Biryani',
      description: '',
      image_url: '',
      restaurant_name: '',
      is_recommended: false,
    });
    setEditingItem(null);
    setShowAddForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading menu...</div>;
  }

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
                className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
                required
              />
              <input
                type="number"
                placeholder="Price (₹) *"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
                required
              />
            </div>

            {/* Category & Restaurant */}
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
              >
                <option value="Biryani">Biryani</option>
                <option value="Chinese">Chinese</option>
                <option value="Snacks">Snacks</option>
                <option value="Drinks">Drinks</option>
              </select>
              <div className="relative">
                <Store className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Restaurant Name"
                  value={formData.restaurant_name}
                  onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                  className="w-full bg-[#252525] text-white rounded-xl pl-10 pr-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
                />
              </div>
            </div>

            {/* --- FILE UPLOAD SECTION --- */}
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
                      className="absolute top-2 right-2 bg-red-500 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  ref={fileInputRef}
                  className="w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#c4ff00] file:text-black
                    hover:file:bg-[#b3e600]
                    cursor-pointer"
                />
                {uploading && (
                  <div className="absolute right-0 top-0 h-full flex items-center pr-4">
                    <span className="text-[#c4ff00] text-sm animate-pulse">Uploading...</span>
                  </div>
                )}
              </div>
            </div>

            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/20 resize-none"
            />

            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_recommended}
                onChange={(e) =>
                  setFormData({ ...formData, is_recommended: e.target.checked })
                }
                className="w-5 h-5 accent-[#c4ff00]"
              />
              <span>Mark as Recommended</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-[#c4ff00] text-black font-semibold py-3 rounded-xl hover:bg-[#b3e600] transition-colors disabled:opacity-50"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-[#252525] text-white font-semibold py-3 rounded-xl hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-[#1a1a1a] rounded-2xl p-4 flex gap-4">
            <div className="w-20 h-20 bg-[#252525] rounded-xl flex-shrink-0 overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                   {item.category === 'Biryani' && '🍛'}
                   {item.category === 'Chinese' && '🥡'}
                   {item.category === 'Snacks' && '🍟'}
                   {item.category === 'Drinks' && '🥤'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                  <p className="text-[#c4ff00] font-bold">₹{item.price}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 hover:bg-[#252525] rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs text-gray-400 bg-[#252525] px-2 py-0.5 rounded">{item.category}</span>
                 {item.restaurant_name && (
                   <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded truncate max-w-[120px]">
                     {item.restaurant_name}
                   </span>
                 )}
                 {item.is_recommended && (
                  <span className="text-xs bg-[#c4ff00] text-black px-2 py-0.5 rounded">Rec</span>
                )}
              </div>

              <button
                onClick={() => handleToggleAvailability(item)}
                className={`mt-3 w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  item.is_available
                    ? 'bg-[#252525] text-white hover:bg-[#333]'
                    : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                }`}
              >
                {item.is_available ? 'Available' : 'Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
