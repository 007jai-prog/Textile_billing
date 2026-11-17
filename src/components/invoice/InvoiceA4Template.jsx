import React from 'react';
import { formatCurrency, formatDateTime, numberToWords } from '../../utils/formatters';

export const InvoiceA4Template = ({ invoice, settings }) => {
  if (!invoice) return null;

  const store = settings?.store || {};
  const billing = settings?.billing || {};
  const summary = invoice.summary || {};
  const customer = invoice.customer || {};

  return (
    <div className="w-full bg-white p-6 sm:p-8 text-slate-900 font-sans text-xs border border-slate-200 rounded-lg shadow-xs print:border-none print:shadow-none print:p-0">
      {/* Top Banner / Store Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-950">
            {store.storeName || 'SRI MEENAKSHI SILKS & TEXTILES'}
          </h1>
          <p className="text-slate-600 font-medium">{store.tagline || 'Authentic South Indian Silks & Handlooms'}</p>
          <p className="text-slate-500 mt-1">
            {store.address || '48, South Chithirai Street, Madurai - 625001'}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-slate-600">
            <span><strong>GSTIN:</strong> {store.gstin || '33AABCS8899K1ZM'}</span>
            <span><strong>State:</strong> {store.state || 'Tamil Nadu'} (Code: {store.stateCode || '33'})</span>
            <span><strong>Phone:</strong> {store.phone || '+91 452 2345678'}</span>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-slate-300 sm:pl-6 shrink-0">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold tracking-wider rounded text-xs mb-1">
            TAX INVOICE
          </span>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Original for Recipient</p>
        </div>
      </div>

      {/* Invoice & Customer Meta Grid */}
      <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-3.5 mb-5 bg-slate-50/50">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Billed To / Customer</p>
          <h4 className="font-bold text-sm text-slate-900 mt-0.5">{customer.name || 'Walk-in Customer'}</h4>
          <p className="text-slate-600 mt-0.5">Phone: {customer.phone || '-'}</p>
          {customer.address && <p className="text-slate-600">{customer.address}</p>}
          {customer.city && <p className="text-slate-600">{customer.city}, {customer.state || 'Tamil Nadu'}</p>}
          {customer.gstin && <p className="font-semibold text-slate-800 mt-0.5">GSTIN: {customer.gstin}</p>}
        </div>

        <div className="text-right space-y-1">
          <div className="flex justify-end gap-2">
            <span className="text-slate-500">Invoice No:</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-end gap-2">
            <span className="text-slate-500">Date & Time:</span>
            <span className="font-medium text-slate-800">{formatDateTime(invoice.date)}</span>
          </div>
          <div className="flex justify-end gap-2">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-semibold text-indigo-700">{invoice.payment?.method || 'Cash'}</span>
          </div>
          <div className="flex justify-end gap-2">
            <span className="text-slate-500">Cashier:</span>
            <span className="text-slate-700">{invoice.cashier || 'Sundar'}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-y border-slate-300 font-semibold text-[11px]">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2">Item Description</th>
              <th className="py-2 px-2">Size / Variant</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-right">Unit Rate</th>
              <th className="py-2 px-2 text-right">Disc</th>
              <th className="py-2 px-2 text-right">Taxable</th>
              <th className="py-2 px-2 text-center">GST %</th>
              <th className="py-2 px-2 text-right">GST Amt</th>
              <th className="py-2 px-2 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(invoice.items || []).map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/50">
                <td className="py-2 px-2 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                <td className="py-2 px-2">
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-[10px] text-slate-500 flex gap-2">
                    <span>SKU: {item.sku || '-'}</span>
                    <span>Fabric: {item.fabric || '-'}</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-slate-700">
                  {item.size} {item.color ? `• ${item.color}` : ''}
                </td>
                <td className="py-2 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                <td className="py-2 px-2 text-right text-slate-700">{formatCurrency(item.unitPrice, false)}</td>
                <td className="py-2 px-2 text-right text-slate-500">
                  {item.itemDiscountAmount > 0 ? formatCurrency(item.itemDiscountAmount, false) : '-'}
                </td>
                <td className="py-2 px-2 text-right font-medium text-slate-800">
                  {formatCurrency(item.taxableAmount, false)}
                </td>
                <td className="py-2 px-2 text-center text-slate-600">{item.gstRate}%</td>
                <td className="py-2 px-2 text-right text-slate-600">{formatCurrency(item.taxAmount, false)}</td>
                <td className="py-2 px-2 text-right font-bold text-slate-900">{formatCurrency(item.lineTotal, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax & Grand Total Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
        <div>
          {/* Amount in words */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-3">
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Amount in Words:</p>
            <p className="font-semibold text-slate-800 italic mt-0.5">
              {numberToWords(summary.netPayable)}
            </p>
          </div>

          {/* Payment receipt confirmation */}
          <div className="text-[11px] text-slate-600 space-y-1">
            <p><strong>Payment Received:</strong> {formatCurrency(invoice.payment?.amountReceived || summary.netPayable)} via {invoice.payment?.method}</p>
            {invoice.payment?.changeReturned > 0 && (
              <p><strong>Change Returned:</strong> {formatCurrency(invoice.payment.changeReturned)}</p>
            )}
            {invoice.payment?.reference && (
              <p className="text-slate-500"><strong>Ref / Auth:</strong> {invoice.payment.reference}</p>
            )}
            {invoice.notes && (
              <p className="italic text-slate-500"><strong>Note:</strong> {invoice.notes}</p>
            )}
          </div>
        </div>

        {/* Calculation Table */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between py-1 text-slate-600">
            <span>Gross Subtotal:</span>
            <span>{formatCurrency(summary.grossSubtotal)}</span>
          </div>

          {summary.totalDiscount > 0 && (
            <div className="flex justify-between py-1 text-emerald-600 font-medium">
              <span>Total Discount:</span>
              <span>- {formatCurrency(summary.totalDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 text-slate-600 border-t border-slate-100">
            <span>Taxable Value:</span>
            <span>{formatCurrency(summary.taxableSubtotal)}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>CGST Total:</span>
            <span>{formatCurrency(summary.totalCGST)}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>SGST Total:</span>
            <span>{formatCurrency(summary.totalSGST)}</span>
          </div>

          {summary.roundOff !== 0 && (
            <div className="flex justify-between py-1 text-slate-500">
              <span>Round Off:</span>
              <span>{summary.roundOff > 0 ? '+' : ''}{formatCurrency(summary.roundOff)}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-950">
            <span>NET AMOUNT PAYABLE:</span>
            <span className="text-base text-indigo-700">{formatCurrency(summary.netPayable)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions / Signatory */}
      <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 items-end">
        <div>
          <h5 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider mb-1">Terms & Conditions:</h5>
          <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
            {billing.termsAndConditions || '1. Goods once sold can be exchanged within 7 days with bill.\n2. Silk sarees and cut fabrics cannot be returned.\nThank you!'}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-800">For {store.storeName || 'Sri Meenakshi Silks'}</p>
          <div className="h-12"></div>
          <p className="text-[11px] text-slate-500 border-t border-slate-300 pt-1 inline-block min-w-[140px]">
            Authorized Signatory
          </p>
        </div>
      </div>
    </div>
  );
};
