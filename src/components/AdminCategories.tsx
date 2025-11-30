import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category } from '../lib/database.types';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCategory.name || !newCategory.icon) return alert('Name and Icon required');
    
    try {
      const nextOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.sort_order)) + 1 
        : 1;

      const { error } = await supabase.from('categories').insert({
        name: newCategory.name,
        icon: newCategory.icon,
        sort_order: nextOrder
      });

      if (error) throw error;
      setNewCategory({ name: '', icon: '' });
      loadCategories();
    } catch (error) {
      alert('Error adding category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      loadCategories();
    } catch (error) {
      alert('Error deleting category');
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800">
        <h2 className="font-semibold mb-4 text-white">Add Category</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Name (e.g. Desserts)"
            value={newCategory.name}
            onChange={e => setNewCategory({...newCategory, name: e.target.value})}
            className="flex-1 bg-[#252525] text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c4ff00]/20"
          />
          <input
            type="text"
            placeholder="Icon (e.g. 🍰)"
            value={newCategory.icon}
            onChange={e => setNewCategory({...newCategory, icon: e.target.value})}
            className="w-24 bg-[#252525] text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c4ff00]/20 text-center"
          />
          <button onClick={handleAdd} className="bg-[#c4ff00] text-black p-3 rounded-xl hover:bg-[#b3e600]">
            <Plus />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-[#1a1a1a] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl bg-[#252525] w-12 h-12 flex items-center justify-center rounded-lg">{cat.icon}</span>
              <span className="font-semibold text-lg">{cat.name}</span>
            </div>
            <button onClick={() => handleDelete(cat.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
