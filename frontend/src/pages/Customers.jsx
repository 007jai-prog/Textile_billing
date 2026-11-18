import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Edit,
  Trash2,
  Receipt,
  Eye,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerModal } from '../components/customers/CustomerModal';
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Customers = () => {
  const { customers, invoices, settings, addCustomer, updateCustomer, deleteCustomer } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [customerForHistory, setCustomerForHistory] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState(null);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesType = selectedType === 'All' || c.type === selectedType;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesType;

      const matchesName = c.name.toLowerCase().includes(q);
      const matchesPhone = c.phone.includes(q);
      const matchesCity = (c.city || '').toLowerCase().includes(q);
      const matchesGstin = (c.gstin || '').toLowerCase().includes(q);

      return matchesType && (matchesName || matchesPhone || matchesCity || matchesGstin);
    });
  }, [customers, selectedType, searchQuery]);

  const handleOpenAdd = () => {
    setCustomerToEdit(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setCustomerToEdit(customer);
    setIsAddEditModalOpen(true);
  };

  const handleSaveCustomer = (custData) => {
    if (customerToEdit) {
      updateCustomer(customerToEdit.id, custData);
    } else {
      addCustomer(custData);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteCandidateId) {
      deleteCustomer(deleteCandidateId);
      setDeleteCandidateId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer accounts, contact details, GSTIN records, and lifetime purchase histories
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, mobile, city, or GSTIN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="All">All Customer Types</option>
            <option value="Retail">Retail</option>
            <option value="B2B">B2B / Wholesale</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Type / GSTIN</th>
                <th className="py-3 px-3 text-center">Bills</th>
                <th className="py-3 px-3 text-right">Lifetime Spend</th>
                <th className="py-3 px-3">Last Visit</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No matching customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{cust.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-700 font-medium">{cust.phone}</div>
                      {cust.email && <div className="text-[10px] text-slate-400">{cust.email}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{cust.city || '-'}</div>
                      <div className="text-[10px] text-slate-400">{cust.state || 'Tamil Nadu'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cust.type === 'B2B' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {cust.type || 'Retail'}
                      </span>
                      {cust.gstin && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {cust.gstin}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {cust.totalBills || 0}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(cust.totalPurchases || 0)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {cust.lastPurchaseDate ? formatDateTime(cust.lastPurchaseDate, 'DD MMM YYYY') : 'New'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCustomerForHistory(cust)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Invoices History"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidateId(cust.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddEditModalOpen && (
        <CustomerModal
          isOpen={isAddEditModalOpen}
          onClose={() => setIsAddEditModalOpen(false)}
          customerToEdit={customerToEdit}
          onSave={handleSaveCustomer}
        />
      )}

      {/* Customer Purchase History Modal */}
      {customerForHistory && (
        <CustomerDetailModal
          isOpen={Boolean(customerForHistory)}
          onClose={() => setCustomerForHistory(null)}
          customer={customerForHistory}
          invoices={invoices}
          onViewInvoice={(inv) => setSelectedInvoice(inv)}
        />
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          settings={settings}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteCandidateId && (
        <ConfirmDialog
          isOpen={Boolean(deleteCandidateId)}
          onClose={() => setDeleteCandidateId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Customer Record"
          message="Are you sure you want to delete this customer? This action will remove their profile from the quick customer picker."
          confirmText="Delete Customer"
          isDestructive={true}
        />
      )}
    </div>
  );
};
