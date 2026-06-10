import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star } from 'lucide-react';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';

interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export default function MyAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pinCode: '', isDefault: false
  });

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/account/addresses');
      setAddresses(data);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setForm({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pinCode: '', isDefault: false });
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleEdit = (address: Address) => {
    setForm({
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      isDefault: address.isDefault
    });
    setEditingId(address.id);
    setFormMode('EDIT');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/account/addresses/${id}`);
      fetchAddresses();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'ADD') {
        await api.post('/account/addresses', form);
      } else {
        await api.put(`/account/addresses/${editingId}`, form);
      }
      fetchAddresses();
      resetForm();
    } catch (err) {
      console.error('Failed to save address:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-xl font-bold text-primary">Saved Addresses</h2>
        {!isFormOpen && (
          <Button 
            onClick={() => { setFormMode('ADD'); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Address
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-bg rounded-xl border border-border p-6 mb-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">
            {formMode === 'ADD' ? 'Add New Address' : 'Edit Address'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Full Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Phone Number *</label>
                <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Address Line 1 *</label>
              <input required type="text" value={form.line1} onChange={e => setForm({...form, line1: e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Address Line 2</label>
              <input type="text" value={form.line2} onChange={e => setForm({...form, line2: e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">City *</label>
                <input required type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">State *</label>
                <input required type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">PIN Code *</label>
                <input required type="text" value={form.pinCode} onChange={e => setForm({...form, pinCode: e.target.value})} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="rounded text-accent focus:ring-accent w-4 h-4" />
              <label htmlFor="isDefault" className="text-sm font-medium text-text">Make this my default address</label>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" loading={submitting} loadingText="Saving..." className="flex items-center justify-center min-w-[120px] px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
                Save Address
              </Button>
              <Button type="button" onClick={resetForm} disabled={submitting} className="px-4 py-2 bg-surface border border-border text-text text-sm font-medium rounded-lg hover:bg-bg transition-colors">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {!isFormOpen && addresses.length === 0 ? (
        <div className="text-center py-16 bg-bg rounded-xl border border-border">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <p className="text-text font-medium mb-1">No saved addresses</p>
          <p className="text-sm text-text-muted">Add an address for faster checkout.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map(address => (
            <div key={address.id} className="relative bg-bg rounded-xl border border-border p-5 hover:border-accent transition-colors group">
              {address.isDefault && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-md">
                  <Star className="w-3 h-3 fill-accent" /> Default
                </span>
              )}
              
              <p className="font-semibold text-text mb-2 pr-20">{address.name}</p>
              <div className="text-sm text-text-muted space-y-1 mb-4">
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>{address.city}, {address.state} {address.pinCode}</p>
                <p className="pt-2">Phone: {address.phone}</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <Button onClick={() => handleEdit(address)} className="flex items-center gap-1.5 text-xs font-medium text-text hover:text-primary transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button onClick={() => handleDelete(address.id)} className="flex items-center gap-1.5 text-xs font-medium text-error hover:text-error-dark transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
