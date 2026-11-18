import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const Thermal80mmTemplate = ({ invoice, settings }) => {
  if (!invoice) return null;

  const store = settings?.store || {};
  const summary = invoice.summary || {};
  const customer = invoice.customer || {};

  return (
    <div className="w-[300px] mx-auto bg-white p-4 text-black font-mono text-[11px] leading-tight border border-dashed border-slate-300 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="text-sm font-bold uppercase">{store.storeName || 'SRI MEENAKSHI SILKS'}</h2>
        <p className="text-[10px]">{store.tagline || 'South Indian Silks & Handlooms'}</p>
        <p className="text-[9px] mt-0.5">{store.address || '48, South Chithirai St, Madurai'}</p>
        <p className="text-[10px] font-bold mt-1">GSTIN: {store.gstin || '33AABCS8899K1ZM'}</p>
        <p className="text-[9px]">Ph: {store.phone || '+91 452 2345678'}</p>
      </div>

      {/* Meta */}
      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Bill No: <strong>{invoice.invoiceNumber}</strong></span>
          <span>{invoice.payment?.method || 'Cash'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {formatDateTime(invoice.date, 'DD/MM/YY hh:mm A')}</span>
        </div>
        <div className="flex justify-between">
          <span>Cust: {customer.name || 'Walk-in'}</span>
          <span>{customer.phone ? `Ph: ${customer.phone}` : ''}</span>
        </div>
        <div>
          <span>Cashier: {invoice.cashier || 'Terminal 01'}</span>
        </div>
      </div>

      {/* Line Items */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between font-bold text-[10px] mb-1">
          <span className="w-1/2">Item / Size</span>
          <span className="w-1/4 text-center">Qty x Rate</span>
          <span className="w-1/4 text-right">Amt</span>
        </div>

        {(invoice.items || []).map((item, idx) => (
          <div key={item.id || idx} className="py-1">
            <div className="font-semibold text-[10px] truncate">{item.name}</div>
            <div className="flex justify-between text-[9px] text-slate-700">
              <span className="w-1/2 truncate">{item.size} {item.color ? `(${item.color})` : ''}</span>
              <span className="w-1/4 text-center">{item.quantity} x {item.unitPrice}</span>
              <span className="w-1/4 text-right font-bold">{formatCurrency(item.lineTotal, false)}</span>
            </div>
            {item.itemDiscountAmount > 0 && (
              <div className="text-[9px] text-right text-slate-600">
                Item Disc: -{formatCurrency(item.itemDiscountAmount, false)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals Summary */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Total Items / Qty:</span>
          <span>{summary.totalItems} / {summary.totalQuantity}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(summary.grossSubtotal)}</span>
        </div>

        {summary.totalDiscount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>- {formatCurrency(summary.totalDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Taxable Value:</span>
          <span>{formatCurrency(summary.taxableSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>CGST:</span>
          <span>{formatCurrency(summary.totalCGST)}</span>
        </div>
        <div className="flex justify-between">
          <span>SGST:</span>
          <span>{formatCurrency(summary.totalSGST)}</span>
        </div>

        {summary.roundOff !== 0 && (
          <div className="flex justify-between">
            <span>Round Off:</span>
            <span>{summary.roundOff > 0 ? '+' : ''}{formatCurrency(summary.roundOff)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
          <span>NET PAYABLE:</span>
          <span>{formatCurrency(summary.netPayable)}</span>
        </div>
      </div>

      {/* Payment details */}
      <div className="py-1.5 border-b border-dashed border-black text-[9px] space-y-0.5">
        <div className="flex justify-between">
          <span>Received ({invoice.payment?.method}):</span>
          <span>{formatCurrency(invoice.payment?.amountReceived || summary.netPayable)}</span>
        </div>
        {invoice.payment?.changeReturned > 0 && (
          <div className="flex justify-between font-bold">
            <span>Change Returned:</span>
            <span>{formatCurrency(invoice.payment.changeReturned)}</span>
          </div>
        )}
        {invoice.payment?.reference && (
          <div className="truncate">Ref: {invoice.payment.reference}</div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 text-[9px] space-y-0.5">
        <p className="font-semibold">*** THANK YOU! VISIT AGAIN ***</p>
        <p>Exchange within 7 days with bill.</p>
        <p>No exchange on cut pieces / silks.</p>
      </div>
    </div>
  );
};
