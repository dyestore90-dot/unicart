import { useEffect, useState } from 'react';
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
  
  // Separate state for the form visibility and the input text
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
      alert('Tracking status updated successfully!');
      loadBatch();
    } catch (error) {
      console.error('Error updating tracking:', error);
      alert('Failed to update tracking status');
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
        status_message: 'Accepting orders for this slot',
      });

      if (error) throw error;

      alert('New batch created successfully!');
      setIsCreating(false);
      setNewSlotLabel('');
      loadBatch();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Failed to create new batch');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Batch Info */}
      <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="font-semibold mb-4 text-white">Current Batch</h2>
        <p className="text-gray-400 text-sm mb-1">Active Slot</p>
        <p className="font-semibold text-[#c4ff00] text-lg mb-4">
          {batch?.slot_label || 'No active batch'}
        </p>

        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="text-sm text-gray-400 hover:text-white underline transition-colors"
          >
            + Create New Batch
          </button>
        ) : (
          <button
            onClick={() => setIsCreating(false)}
            className="text-sm text-red-400 hover:text-red-300 underline transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Create New Batch Form */}
      {isCreating && (
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#c4ff00]/30 animate-fade-in">
          <h2 className="font-semibold mb-4 text-white">Create New Batch</h2>
          <input
            type="text"
            placeholder="e.g., Dinner 8:00-8:30 PM"
            value={newSlotLabel}
            onChange={(e) => setNewSlotLabel(e.target.value)}
            className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50"
          />
          <button
            onClick={handleCreateNewBatch}
            disabled={updating}
            className="w-full bg-[#c4ff00] text-black font-semibold py-3 rounded-xl hover:bg-[#b3e600] transition-colors disabled:opacity-50"
          >
            {updating ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      )}

      {/* Tracking Controls (Only show if a batch exists) */}
      {batch && !isCreating && (
        <>
          <div className="bg-[#1a1a1a] rounded-2xl p-5">
            <h2 className="font-semibold mb-4 text-white">Update Status</h2>

            <div className="space-y-3 mb-5">
              {statusOptions.map((option) => (
                <label
                  key={option.step}
                  className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors border ${
                    currentStep === option.step
                      ? 'bg-[#c4ff00] text-black border-[#c4ff00]'
                      : 'bg-[#252525] text-white border-transparent hover:bg-[#2a2a2a]'
                  }`}
                >
                  <input
                    type="radio"
                    name="step"
                    value={option.step}
                    checked={currentStep === option.step}
                    onChange={(e) => setCurrentStep(Number(e.target.value))}
                    className="w-5 h-5 accent-black"
                  />
                  <span className="font-medium">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-sm text-gray-400 mb-2">
                Custom Message (shown to users)
              </label>
              <textarea
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="E.g., Orders are being prepared..."
                rows={2}
                className="w-full bg-[#252525] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c4ff00]/50 resize-none"
              />
            </div>

            <button
              onClick={handleUpdateTracking}
              disabled={updating}
              className="w-full bg-[#1a1a1a] text-white border border-gray-600 font-semibold py-3 rounded-xl hover:bg-[#252525] transition-colors disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Tracking Status'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
