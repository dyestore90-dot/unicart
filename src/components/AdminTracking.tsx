import { useEffect, useState } from 'react';
import { Power, PowerOff, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { OrderBatch } from '../lib/database.types';

const statusOptions = [
  { step: 1, label: 'Collecting Orders' },
  { step: 2, label: 'Order Placed at Restaurant' },
  { step: 3, label: 'Preparing Food' },
  { step: 4, label: 'Out for Delivery' },
  { step: 5, label: 'Delivered' },
];

export function AdminTracking() {
  const [batch, setBatch] = useState<OrderBatch | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newSlotLabel, setNewSlotLabel] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadBatch();
  }, []);

  const loadBatch = async () => {
    try {
      const { data } = await supabase
        .from('order_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setBatch(data);
        setCurrentStep(data.current_step);
        setStatusMessage(data.status_message);
      } else {
        setBatch(null);
      }
    } catch (error) {
      console.error('Error loading batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!batch) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('order_batches')
        .update({
          current_step: currentStep,
          status_message: statusMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batch.id);

      if (error) throw error;
      alert('Tracking status updated!');
      loadBatch();
    } catch (error) {
      alert('Failed to update tracking');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateNewBatch = async () => {
    if (!newSlotLabel) {
      alert('Please enter a slot label');
      return;
    }
    setUpdating(true);
    try {
      const { error } = await supabase.from('order_batches').insert({
        slot_label: newSlotLabel,
        current_step: 1,
        status_message: 'Accepting orders',
        is_active: true
      });

      if (error) throw error;
      alert('New batch created! Orders are now OPEN.');
      setIsCreating(false);
      setNewSlotLabel('');
      loadBatch();
    } catch (error) {
      alert('Failed to create batch');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleBatchStatus = async () => {
    if (!batch) return;
    const newStatus = !batch.is_active;
    if (!newStatus) {
      if(!confirm(`Close "${batch.slot_label}"? No more orders will be accepted.`)) return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('order_batches')
        .update({ is_active: newStatus })
        .eq('id', batch.id);

      if (error) throw error;
      loadBatch();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // --- NEW: EXPORT ORDERS TO CSV ---
  const handleExportOrders = async () => {
    if (!batch) return;
    
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('batch_id', batch.id);

    if (!orders || orders.length === 0) {
      alert('No orders found in this batch.');
      return;
    }

    // Create CSV content
    const headers = ['Order ID', 'Name', 'Phone', 'Items', 'Total (Rs)', 'Date'];
    const csvRows = [headers.join(',')];

    orders.forEach(order => {
      // Format items into a single string like "2x Biryani | 1x Coke"
      const itemsString = (order.items as any[])
        .map((i: any) => `${i.quantity}x ${i.name}`)
        .join(' | ');

      const row = [
        order.id,
        `"${order.user_name}"`, // Quote strings to handle commas
        `"${order.phone}"`,
        `"${itemsString}"`,
        order.total_amount,
        new Date(order.created_at).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    });

    // Trigger download
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.slot_label.replace(/\s/g, '_')}_Orders.csv`;
    a.click();
  };

  // --- RESTORED: DELETE BATCH ---
  const handleDeleteBatch = async () => {
    if (!batch) return;
    if (!confirm('⚠️ Are you sure? This will PERMANENTLY DELETE this batch and ALL its orders history.\n\nDid you download the report first?')) return;

    setUpdating(true);
    try {
      const { error } = await supabase.from('order_batches').delete().eq('id', batch.id);
      if (error) throw error;
      setBatch(null);
      loadBatch();
    } catch (error) {
      alert('Failed to delete batch');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="font-semibold mb-4 text-white">Current Batch</h2>
        
        {batch ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Slot Label</p>
                <p className="font-semibold text-lg text-white">{batch.slot_label}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${batch.is_active ? 'bg-[#c4ff00]/20 text-[#c4ff00]' : 'bg-red-500/20 text-red-500'}`}>
                {batch.is_active ? 'OPEN' : 'CLOSED'}
              </div>
            </div>

            {/* ACTION BUTTONS GRID */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={handleToggleBatchStatus}
                disabled={updating}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors text-sm ${
                  batch.is_active 
                    ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' 
                    : 'bg-[#c4ff00] text-black hover:bg-[#b3e600]'
                }`}
              >
                {batch.is_active ? <><PowerOff size={16} /> Stop Orders</> : <><Power size={16} /> Open Orders</>}
              </button>

              <button
                onClick={handleExportOrders}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-sm"
              >
                <Download size={16} /> Save Report
              </button>
            </div>

            {/* DELETE BUTTON (Only show if closed, for safety) */}
            {!batch.is_active && (
              <button
                onClick={handleDeleteBatch}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 text-sm mt-2"
              >
                <Trash2 size={16} /> Delete Permanently
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">No active batch.</p>
            {!isCreating && (
              <button onClick={() => setIsCreating(true)} className="bg-[#c4ff00] text-black font-semibold px-6 py-2 rounded-xl">
                + Create Batch
              </button>
            )}
          </div>
        )}
      </div>

      {isCreating && (
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#c4ff00]/30 animate-fade-in">
          <h2 className="font-semibold mb-4 text-white">Create New Batch</h2>
          <input
            type="text"
            placeholder="e.g., Dinner 8:00 PM"
            value={newSlotLabel}
            onChange={(e) => setNewSlotLabel(e.target.value)}
            className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50"
          />
          <button onClick={handleCreateNewBatch} disabled={updating} className="w-full bg-[#c4ff00] text-black font-semibold py-3 rounded-xl hover:bg-[#b3e600]">
            {updating ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      )}

      {/* TRACKING CONTROLS */}
      {batch && (
        <div className={`bg-[#1a1a1a] rounded-2xl p-5 ${!batch.is_active && 'opacity-50 pointer-events-none'}`}>
          <h2 className="font-semibold mb-4 text-white">Update Status</h2>
          <div className="space-y-3 mb-5">
            {statusOptions.map((option) => (
              <label key={option.step} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border ${currentStep === option.step ? 'bg-[#c4ff00] text-black border-[#c4ff00]' : 'bg-[#252525] text-white border-transparent'}`}>
                <input type="radio" name="step" value={option.step} checked={currentStep === option.step} onChange={(e) => setCurrentStep(Number(e.target.value))} className="w-5 h-5 accent-black" />
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
          <textarea value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} rows={2} className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50" />
          <button onClick={handleUpdateTracking} disabled={updating} className="w-full bg-[#1a1a1a] text-white border border-gray-600 font-semibold py-3 rounded-xl hover:bg-[#252525]">
            {updating ? 'Updating...' : 'Update Tracking Status'}
          </button>
        </div>
      )}
    </div>
  );
}
