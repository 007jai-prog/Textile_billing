import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

export const CustomerModal = ({ isOpen, onClose, customerToEdit, onSave }) => {
  const isEditing = Boolean(customerToEdit);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Salem',
    state: 'Tamil Nadu',
    address: '',
    gstin: '',
    type: 'Retail'
  });

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name || '',
        phone: customerToEdit.phone || '',
        email: customerToEdit.email || '',
        city: customerToEdit.city || 'Salem',
        state: customerToEdit.state || 'Tamil Nadu',
        address: customerToEdit.address || '',
        gstin: customerToEdit.gstin || '',
        type: customerToEdit.type || 'Retail'
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        city: 'Salem',
        state: 'Tamil Nadu',
        address: '',
        gstin: '',
        type: 'Retail'
      });
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Name and Phone are required.');
      return;
    }

    const payload = {
      ...formData,
      id: customerToEdit?.id || `cust-${Date.now()}`,
      totalPurchases: customerToEdit?.totalPurchases || 0,
      totalBills: customerToEdit?.totalBills || 0,
      lastPurchaseDate: customerToEdit?.lastPurchaseDate || null,
    };

    onSave(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer Details' : 'Register New Customer'}
      subtitle="Save contact information and GSTIN for invoicing"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Full Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Meenakshi Sundaram"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="10-digit phone"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@domain.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Madurai"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Tamil Nadu"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Street Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Door No, Street Name, Area"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">GSTIN (for B2B bills)</label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              placeholder="33AAACS1234F1Z5"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-hidden focus:border-indigo-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            >
              <option value="Retail">Retail</option>
              <option value="B2B">B2B / Wholesale</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            {isEditing ? 'Save Changes' : 'Register Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
