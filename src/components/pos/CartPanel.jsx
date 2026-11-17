import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  Percent,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Edit2,
  Check
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export const CartPanel = ({ onOpenCustomerModal, onOpenPaymentModal }) => {
  const {
    cartItems,
    customer,
    billDiscount,
    setBillDiscount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    appliedFestival,
    cartTotals,
    updateQuantity,
    updateUnitPrice,
    updateItemDiscount,
    removeFromCart,
    clearCart,
  } = useCart();

  // Price editing state
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  // Item discount editing state
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [tempDiscountType, setTempDiscountType] = useState('fixed');
  const [tempDiscountVal, setTempDiscountVal] = useState('');

  // Bill discount input state
  const [isBillDiscountOpen, setIsBillDiscountOpen] = useState(false);
  const [billDiscType, setBillDiscType] = useState(billDiscount.type || 'fixed');
  const [billDiscVal, setBillDiscVal] = useState(billDiscount.value || 0);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isCouponOpen, setIsCouponOpen] = useState(false);

  const startEditPrice = (item) => {
    setEditingPriceId(item.id);
    setTempPrice(item.unitPrice);
  };

  const saveEditPrice = (itemId) => {
    updateUnitPrice(itemId, tempPrice);
    setEditingPriceId(null);
  };

  const startEditDiscount = (item) => {
    setEditingDiscountId(item.id);
    setTempDiscountType(item.discountType || 'fixed');
    setTempDiscountVal(item.discountValue || 0);
  };

  const saveEditDiscount = (itemId) => {
    updateItemDiscount(itemId, tempDiscountType, tempDiscountVal);
    setEditingDiscountId(null);
  };

  const handleApplyBillDiscount = (e) => {
    e.preventDefault();
    setBillDiscount({ type: billDiscType, value: Number(billDiscVal) || 0 });
    setIsBillDiscountOpen(false);
  };

  return (
    <div
      className="bg-theme-card rounded-2xl border shadow-sm flex flex-col h-full overflow-hidden transition-colors"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)'
      }}
    >
      {/* 1. Header & Customer Selection */}
      <div
        className="p-3.5 border-b flex items-center justify-between transition-colors"
        style={{
          backgroundColor: 'var(--theme-primary-light)',
          borderColor: 'var(--theme-border)'
        }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-primary)'
            }}
          >
            <User className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer</span>
            <h4 className="text-xs font-bold text-slate-900 truncate">{customer?.name || 'Walk-in Customer'}</h4>
            {customer?.phone && customer?.id !== 'walk-in' && (
              <span className="text-[10px] text-slate-500 font-mono">{customer.phone}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCustomerModal}
          className="px-2.5 py-1 text-xs font-semibold bg-white border rounded-lg shadow-2xs transition-colors flex items-center gap-1"
          style={{
            color: 'var(--theme-primary)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <span>Change</span>
          <kbd className="hidden sm:inline-block px-1 bg-slate-100 rounded text-[9px] font-mono">F4</kbd>
        </button>
      </div>

      {/* 2. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
              <ShoppingBag className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-600">Cart is empty</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
              Search for or select products to add to this bill.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="pt-2.5 first:pt-0">
              {/* Item Title & Variant */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h5>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                    <span className="font-semibold px-1.5 py-0.2 bg-slate-100 rounded text-slate-700">
                      {item.size}
                    </span>
                    {item.color && (
                      <span className="flex items-center gap-1">
                        {item.hex && (
                          <span
                            className="w-2 h-2 rounded-full inline-block border border-slate-300"
                            style={{ backgroundColor: item.hex }}
                          />
                        )}
                        {item.color}
                      </span>
                    )}
                    <span>• GST {item.gstRate}%</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Price, Qty & Discount controls */}
              <div className="flex items-center justify-between mt-2">
                {/* Quantity */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 bg-white rounded flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold shadow-2xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs text-slate-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 bg-white rounded flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Unit Price (Editable) */}
                <div className="text-right">
                  {editingPriceId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-xs font-bold border border-indigo-400 rounded focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveEditPrice(item.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditPrice(item)}
                        className="text-slate-400 hover:text-indigo-600 p-0.5"
                        title="Edit unit price"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Item Discount button */}
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {editingDiscountId === item.id ? (
                      <div className="flex items-center gap-1 bg-amber-50 p-1 rounded border border-amber-200">
                        <select
                          value={tempDiscountType}
                          onChange={(e) => setTempDiscountType(e.target.value)}
                          className="text-[10px] bg-white border border-slate-300 rounded"
                        >
                          <option value="fixed">₹</option>
                          <option value="percent">%</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={tempDiscountVal}
                          onChange={(e) => setTempDiscountVal(e.target.value)}
                          className="w-12 text-[10px] px-1 py-0.5 border border-slate-300 rounded font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => saveEditDiscount(item.id)}
                          className="p-0.5 text-emerald-700 font-bold"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditDiscount(item)}
                        className={`text-[10px] font-medium flex items-center gap-0.5 ${
                          item.discountValue > 0
                            ? 'text-emerald-600 font-bold'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>
                          {item.discountValue > 0
                            ? `Disc -${item.discountType === 'percent' ? `${item.discountValue}%` : `₹${item.discountValue}`}`
                            : 'Add Disc'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Totals & Checkout Section */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200/90 space-y-2">
        {/* Active Festival Offer Banner */}
        {appliedFestival && (
          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border border-amber-300 text-[11px] flex items-center justify-between text-amber-900 font-medium">
            <span className="truncate">{appliedFestival.banner_text || `🎉 ${appliedFestival.festival_name} Active`}</span>
            <span className="font-bold shrink-0 ml-1">
              -{formatCurrency(cartTotals.festivalDiscountAmount)}
            </span>
          </div>
        )}

        {/* Coupon Code / Discount row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBillDiscountOpen(!isBillDiscountOpen)}
              className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Bill Disc {billDiscount.value > 0 ? `(${billDiscount.type === 'percent' ? `${billDiscount.value}%` : `₹${billDiscount.value}`})` : ''}</span>
            </button>

            <span className="text-slate-300">•</span>

            {!appliedCoupon ? (
              <button
                type="button"
                onClick={() => setIsCouponOpen(!isCouponOpen)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <span>+ Coupon</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                <span>{appliedCoupon.code}</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="hover:text-rose-600 text-[10px]"
                  title="Remove coupon"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {cartTotals.totalDiscount > 0 && (
            <span className="text-emerald-600 font-bold">
              - {formatCurrency(cartTotals.totalDiscount)}
            </span>
          )}
        </div>

        {/* Coupon input form */}
        {isCouponOpen && !appliedCoupon && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (couponCodeInput.trim()) {
                applyCoupon(couponCodeInput.trim());
                setIsCouponOpen(false);
              }
            }}
            className="p-2 bg-white rounded-lg border border-indigo-200 shadow-2xs flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Enter coupon code (e.g. SILK15)"
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              className="w-full text-xs uppercase font-mono px-2 py-1 bg-slate-50 border border-slate-300 rounded font-bold"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold shrink-0"
            >
              Apply
            </button>
          </form>
        )}

        {/* Bill discount form popover */}
        {isBillDiscountOpen && (
          <form onSubmit={handleApplyBillDiscount} className="p-2 bg-white rounded-lg border border-indigo-200 shadow-2xs flex items-center gap-2">
            <select
              value={billDiscType}
              onChange={(e) => setBillDiscType(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-1.5 py-1"
            >
              <option value="fixed">Fixed ₹</option>
              <option value="percent">Percent %</option>
            </select>
            <input
              type="number"
              min="0"
              value={billDiscVal}
              onChange={(e) => setBillDiscVal(e.target.value)}
              placeholder="Discount value"
              className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-300 rounded font-bold"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold shrink-0"
            >
              Apply
            </button>
          </form>
        )}

        {/* Breakdown rows */}
        <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
          <div className="flex justify-between">
            <span>Subtotal ({cartTotals.totalQuantity} items):</span>
            <span className="font-semibold text-slate-800">{formatCurrency(cartTotals.grossSubtotal)}</span>
          </div>

          {cartTotals.couponDiscountAmount > 0 && (
            <div className="flex justify-between text-indigo-600 font-medium">
              <span>Coupon ({appliedCoupon?.code}):</span>
              <span>- {formatCurrency(cartTotals.couponDiscountAmount)}</span>
            </div>
          )}

          {cartTotals.festivalDiscountAmount > 0 && (
            <div className="flex justify-between text-amber-700 font-medium">
              <span>Festival Discount:</span>
              <span>- {formatCurrency(cartTotals.festivalDiscountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Taxable Amount:</span>
            <span>{formatCurrency(cartTotals.taxableSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (CGST + SGST):</span>
            <span>{formatCurrency(cartTotals.totalTax)}</span>
          </div>
          {cartTotals.roundOff !== 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Round Off:</span>
              <span>{cartTotals.roundOff > 0 ? '+' : ''}{formatCurrency(cartTotals.roundOff)}</span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-slate-300 flex items-baseline justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Net Payable</span>
          <span
            className="text-xl font-extrabold"
            style={{ color: 'var(--theme-primary)' }}
          >
            {formatCurrency(cartTotals.netPayable)}
          </span>
        </div>

        {/* Bottom Action Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={() => {
              if (window.confirm('Clear all items from this cart?')) {
                clearCart();
              }
            }}
            className="col-span-1 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center"
            title="Clear Cart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={onOpenPaymentModal}
            className="col-span-3 py-2.5 disabled:opacity-40 text-white font-extrabold rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
            style={{
              backgroundColor: 'var(--theme-primary)',
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.15)'
            }}
          >
            <CreditCard className="w-4 h-4" />
            <span>PAY (F8)</span>
            <span className="font-bold">• {formatCurrency(cartTotals.netPayable)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
