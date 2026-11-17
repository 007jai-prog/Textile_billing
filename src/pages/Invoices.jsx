import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Search,
  Printer,
  Download,
  Eye,
  Calendar,
  Filter,
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { exportService } from '../services/exportService';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Invoices = () => {
  const { invoices, settings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, 7days, month
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Text Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customer?.name || '').toLowerCase().includes(q) ||
        (inv.customer?.phone || '').includes(q);

      // 2. Date Filter
      let matchesDate = true;
      const invDate = dayjs(inv.date);
      const today = dayjs();

      if (dateFilter === 'today') {
        matchesDate = invDate.isSame(today, 'day');
      } else if (dateFilter === 'yesterday') {
        matchesDate = invDate.isSame(today.subtract(1, 'day'), 'day');
      } else if (dateFilter === '7days') {
        matchesDate = invDate.isAfter(today.subtract(7, 'day').startOf('day'));
      } else if (dateFilter === 'month') {
        matchesDate = invDate.isSame(today, 'month');
      }

      // 3. Payment Filter
      const matchesPayment =
        paymentFilter === 'all' || inv.payment?.method === paymentFilter;

      return matchesSearch && matchesDate && matchesPayment;
    });
  }, [invoices, searchQuery, dateFilter, paymentFilter]);

  // Aggregate stats of filtered set
  const totalFilteredAmount = filteredInvoices.reduce(
    (sum, inv) => sum + (Number(inv.summary?.netPayable) || 0),
    0
  );

  const handleExportCSV = () => {
    const rows = filteredInvoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      date: formatDateTime(inv.date),
      customerName: inv.customer?.name || 'Walk-in',
      customerPhone: inv.customer?.phone || '',
      itemsCount: inv.items?.length || 0,
      grossSubtotal: inv.summary?.grossSubtotal || 0,
      totalDiscount: inv.summary?.totalDiscount || 0,
      taxableAmount: inv.summary?.taxableSubtotal || 0,
      totalGST: inv.summary?.totalTax || 0,
      netPayable: inv.summary?.netPayable || 0,
      paymentMethod: inv.payment?.method || 'Cash',
      cashier: inv.cashier || ''
    }));

    exportService.exportToCSV('Invoices_Report', rows, [
      { key: 'invoiceNumber', label: 'Invoice Number' },
      { key: 'date', label: 'Date & Time' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerPhone', label: 'Customer Phone' },
      { key: 'itemsCount', label: 'Item Count' },
      { key: 'grossSubtotal', label: 'Gross Subtotal (₹)' },
      { key: 'totalDiscount', label: 'Discount (₹)' },
      { key: 'taxableAmount', label: 'Taxable (₹)' },
      { key: 'totalGST', label: 'Total GST (₹)' },
      { key: 'netPayable', label: 'Net Payable (₹)' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'cashier', label: 'Cashier' }
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">All Invoices & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, reprint, filter and download PDF invoices for customer transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-indigo-500 block">Total Invoiced</span>
            <span className="text-sm font-extrabold text-indigo-900">{formatCurrency(totalFilteredAmount)}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Invoice #, Customer name or Mobile..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Dates' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                dateFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Payment method filter */}
        <div className="w-full md:w-44">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Payments</option>
            <option value="Cash">Cash Only</option>
            <option value="UPI">UPI / QR Only</option>
            <option value="Card">Card Only</option>
            <option value="Split">Split Pay Only</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">GST</th>
                <th className="py-3 px-3 text-right">Total (₹)</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatDateTime(inv.date)}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      <div>{inv.customer?.name || 'Walk-in Customer'}</div>
                      {inv.customer?.phone && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inv.customer.phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {inv.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {inv.payment?.method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatCurrency(inv.summary?.taxableSubtotal || 0)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatCurrency(inv.summary?.totalTax || 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(inv.summary?.netPayable || 0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View & Reprint Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => exportService.downloadInvoicePDF(inv, settings)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
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

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          settings={settings}
        />
      )}
    </div>
  );
};
