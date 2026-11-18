import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const Thermal58mmTemplate = ({ invoice, settings }) => {
  if (!invoice) return null;

  const store = settings?.store || {};
  const summary = invoice.summary || {};
  const customer = invoice.customer || {};

  return (
    <div className="w-[220px] mx-auto bg-white p-2.5 text-black font-mono text-[10px] leading-tight border border-dashed border-slate-300 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* Header */}
      <div className="text-center pb-1.5 border-b border-dashed border-black">
        <h2 className="text-xs font-bold uppercase truncate">{store.storeName || 'SRI MEENAKSHI SILKS'}</h2>
        <p className="text-[8px] truncate">{store.address || '48, South Chithirai St, Madurai'}</p>
        <p className="text-[9px] font-bold">GSTIN: {store.gstin || '33AABCS8899K1ZM'}</p>
      </div>

      {/* Meta */}
      <div className="py-1.5 border-b border-dashed border-black text-[9px] space-y-0.5">
        <div className="flex justify-between">
          <span>Bill: <strong>{invoice.invoiceNumber}</strong></span>
          <span>{invoice.payment?.method || 'Cash'}</span>
        </div>
        <div>
          <span>{formatDateTime(invoice.date, 'DD/MM/YY hh:mm A')}</span>
        </div>
        <div className="truncate">
          <span>Cust: {customer.name || 'Walk-in'}</span>
        </div>
      </div>

      {/* Line Items */}
      <div className="py-1.5 border-b border-dashed border-black">
        {(invoice.items || []).map((item, idx) => (
          <div key={item.id || idx} className="py-0.5">
            <div className="font-semibold text-[9px] truncate">{item.name}</div>
            <div className="flex justify-between text-[8.5px]">
              <span>{item.quantity} x {item.unitPrice}</span>
              <span className="font-bold">{formatCurrency(item.lineTotal, false)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Summary */}
      <div className="py-1.5 border-b border-dashed border-black space-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(summary.grossSubtotal)}</span>
        </div>
        {summary.totalDiscount > 0 && (
          <div className="flex justify-between">
            <span>Disc:</span>
            <span>-{formatCurrency(summary.totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax (GST):</span>
          <span>{formatCurrency(summary.totalTax)}</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold pt-1 border-t border-black">
          <span>PAYABLE:</span>
          <span>{formatCurrency(summary.netPayable)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-1.5 text-[8.5px]">
        <p className="font-semibold">*** THANK YOU ***</p>
        <p>Exchange within 7 days.</p>
      </div>
    </div>
  );
};
