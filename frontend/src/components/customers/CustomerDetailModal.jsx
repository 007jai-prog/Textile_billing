import React from 'react';
import { Phone, Mail, MapPin, Building, Calendar, Receipt, Eye } from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const CustomerDetailModal = ({
  isOpen,
  onClose,
  customer,
  invoices = [],
  onViewInvoice
}) => {
  if (!customer) return null;

  // Filter invoices for this customer
  const customerInvoices = invoices.filter(
    inv => inv.customer?.id === customer.id || inv.customer?.phone === customer.phone
  );

  const totalSpent = customerInvoices.reduce((acc, inv) => acc + (inv.summary?.netPayable || 0), 0) || customer.totalPurchases || 0;
  const billCount = customerInvoices.length || customer.totalBills || 0;
  const avgOrderValue = billCount > 0 ? Math.round(totalSpent / billCount) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle={`Customer Account & Billing History • ${customer.type || 'Retail'}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Total Spent</span>
            <span className="text-xl font-extrabold text-indigo-950 mt-0.5 block">{formatCurrency(totalSpent)}</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Bills</span>
            <span className="text-xl font-extrabold text-emerald-950 mt-0.5 block">{billCount} Invoices</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Avg Order Value</span>
            <span className="text-xl font-extrabold text-amber-950 mt-0.5 block">{formatCurrency(avgOrderValue)}</span>
          </div>
        </div>

        {/* Customer Contact Details */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">PHONE</span>
            <span className="font-mono font-medium text-slate-800">{customer.phone}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">EMAIL</span>
            <span className="text-slate-800 truncate block">{customer.email || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">LOCATION</span>
            <span className="text-slate-800">{customer.city ? `${customer.city}, TN` : '-'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">GSTIN</span>
            <span className="font-mono text-slate-800">{customer.gstin || 'Unregistered'}</span>
          </div>
        </div>

        {/* Invoices List */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Invoice History ({customerInvoices.length})
          </h4>

          {customerInvoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No previous invoices recorded for this customer yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Invoice No</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-center">Items</th>
                    <th className="py-2 px-3">Payment</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{formatDateTime(inv.date, 'DD MMM YYYY')}</td>
                      <td className="py-2 px-3 text-center font-medium text-slate-700">
                        {inv.items?.length || 0}
                      </td>
                      <td className="py-2 px-3 font-semibold text-indigo-700">
                        {inv.payment?.method || 'Cash'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(inv.summary?.netPayable || 0)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewInvoice(inv);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
