import React, { useState } from 'react';
import { Search, UserCheck, UserPlus, Phone, MapPin, Building } from 'lucide-react';
import { Modal } from '../common/Modal';
import { defaultWalkInCustomer } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export const CustomerSelectModal = ({
  isOpen,
  onClose,
  customers = [],
  selectedCustomer,
  onSelectCustomer,
  onAddNewCustomer
}) => {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New customer form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: '',
    gstin: '',
    type: 'Retail'
  });

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please enter customer name and phone number.');
      return;
    }

    const created = onAddNewCustomer({
      id: `cust-${Date.now()}`,
      ...formData,
      totalPurchases: 0,
      totalBills: 0,
      lastPurchaseDate: null
    });

    onSelectCustomer(created);
    setIsAddingNew(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select or Add Customer (F4)"
      subtitle="Link invoice to customer account or select Walk-in"
      maxWidth="max-w-lg"
    >
      {/* 1-Click Walk-in Customer CTA */}
      <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl mb-4">
        <div>
          <h4 className="text-xs font-bold text-indigo-900">Walk-in Customer</h4>
          <p className="text-[11px] text-indigo-700">Default generic retail counter customer</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelectCustomer(defaultWalkInCustomer);
            onClose();
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
        >
          Select Walk-in
        </button>
      </div>

      {/* Tabs: Choose Existing vs Add New */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          type="button"
          onClick={() => setIsAddingNew(false)}
          className={`pb-2 px-4 text-xs font-bold border-b-2 transition-all ${
            !isAddingNew
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Existing Customers ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className={`pb-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            isAddingNew
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {!isAddingNew ? (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, mobile, or city..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Customer list */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching customers found. Click "Add New Customer" above.
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => {
                      onSelectCustomer(cust);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{cust.name}</span>
                        {cust.type === 'B2B' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded">
                            B2B
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {cust.phone}
                        </span>
                        {cust.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {cust.city}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {formatCurrency(cust.totalPurchases || 0, false)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {cust.totalBills || 0} Bills
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Add Customer Form */
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Sundaram"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Chennai"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="33AAAAA0000A1Z5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Type</label>
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

          <button
            type="submit"
            className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Save & Select Customer</span>
          </button>
        </form>
      )}
    </Modal>
  );
};
