import React, { useState, useEffect } from 'react';
import { Banknote, QrCode, CreditCard, Layers, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { round2 } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

export const PaymentModal = ({
  isOpen,
  onClose,
  totals,
  customer,
  onCompletePayment,
  defaultMethod = 'Cash'
}) => {
  const payable = totals?.netPayable || 0;

  const [paymentMethod, setPaymentMethod] = useState(defaultMethod);
  const [tenderedAmount, setTenderedAmount] = useState(payable);
  const [upiRef, setUpiRef] = useState('');
  const [cardAuth, setCardAuth] = useState('');
  const [notes, setNotes] = useState('');

  // Split payment state
  const [splitCash, setSplitCash] = useState(0);
  const [splitUpi, setSplitUpi] = useState(0);
  const [splitCard, setSplitCard] = useState(0);

  // Sync tendered amount whenever modal opens or payable changes
  useEffect(() => {
    if (isOpen) {
      setTenderedAmount(payable);
      setPaymentMethod(defaultMethod);
      setUpiRef(`UPI/${Date.now().toString().slice(-6)}`);
      setCardAuth(`AUTH-${Date.now().toString().slice(-4)}`);
      setSplitCash(payable);
      setSplitUpi(0);
      setSplitCard(0);
      setNotes('');
    }
  }, [isOpen, payable, defaultMethod]);

  if (!isOpen) return null;

  // Change returned for cash
  const changeReturned = Math.max(0, Number(tenderedAmount || 0) - payable);
  const cashShortage = Math.max(0, payable - Number(tenderedAmount || 0));

  // Split calculation
  const splitTotal = round2((Number(splitCash) || 0) + (Number(splitUpi) || 0) + (Number(splitCard) || 0));
  const splitDifference = round2(payable - splitTotal);

  const handleFinish = (e) => {
    e.preventDefault();

    let paymentData = {};

    if (paymentMethod === 'Cash') {
      if (tenderedAmount < payable) {
        alert(`Tendered cash is less than payable amount by ₹${cashShortage}.`);
        return;
      }
      paymentData = {
        amountReceived: tenderedAmount,
        changeReturned,
        reference: 'Cash payment'
      };
    } else if (paymentMethod === 'UPI') {
      paymentData = {
        amountReceived: payable,
        changeReturned: 0,
        reference: upiRef || `UPI/${Date.now().toString().slice(-6)}`
      };
    } else if (paymentMethod === 'Card') {
      paymentData = {
        amountReceived: payable,
        changeReturned: 0,
        reference: cardAuth || `CARD-${Date.now().toString().slice(-4)}`
      };
    } else if (paymentMethod === 'Split') {
      if (Math.abs(splitDifference) > 0.05) {
        alert(`Split total (₹${splitTotal}) must equal net payable (₹${payable}). Difference: ₹${splitDifference}`);
        return;
      }
      paymentData = {
        amountReceived: payable,
        changeReturned: 0,
        splitDetails: {
          cash: Number(splitCash) || 0,
          upi: Number(splitUpi) || 0,
          card: Number(splitCard) || 0
        },
        reference: `Split: Cash ₹${splitCash}, UPI ₹${splitUpi}, Card ₹${splitCard}`
      };
    }

    onCompletePayment(paymentMethod, paymentData, notes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Checkout & Payment (F8)"
      subtitle={`Customer: ${customer?.name || 'Walk-in Customer'}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleFinish} className="space-y-4">
        {/* Total Payable Box */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Payable</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
              ₹{payable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="text-right text-xs text-slate-300">
            <p>{totals.totalItems} Items ({totals.totalQuantity} Units)</p>
            {totals.totalDiscount > 0 && (
              <p className="text-emerald-400 font-medium">Saved ₹{totals.totalDiscount}</p>
            )}
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'Cash', label: 'Cash', icon: Banknote },
              { id: 'UPI', label: 'UPI / QR', icon: QrCode },
              { id: 'Card', label: 'Card', icon: CreditCard },
              { id: 'Split', label: 'Split Pay', icon: Layers },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = paymentMethod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPaymentMethod(tab.id)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CASH METHOD VIEW */}
        {paymentMethod === 'Cash' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cash Tendered (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(Number(e.target.value))}
                className="w-full text-xl font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
                autoFocus
              />
            </div>

            {/* Quick denomination chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTenderedAmount(payable)}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100"
              >
                Exact ₹{payable}
              </button>
              {[500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTenderedAmount(tenderedAmount + amt)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100"
                >
                  +{amt}
                </button>
              ))}
            </div>

            {/* Change returned / shortage indicator */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              {cashShortage > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Short by ₹{cashShortage.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Change to Return: ₹{changeReturned.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UPI METHOD VIEW */}
        {paymentMethod === 'UPI' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Scan & Pay ₹{payable}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">UPI ID: meenakshisilks@icici</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Dynamic Soundbox Ready
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                UPI Reference / UTR Number
              </label>
              <input
                type="text"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                placeholder="UPI/123456789"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>
        )}

        {/* CARD METHOD VIEW */}
        {paymentMethod === 'Card' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Card Approval / Terminal Ref Code
              </label>
              <input
                type="text"
                value={cardAuth}
                onChange={(e) => setCardAuth(e.target.value)}
                placeholder="e.g. AUTH-4912"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-indigo-600"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Swipe or insert card on the EDC POS machine for ₹{payable} and enter approval code.
            </p>
          </div>
        )}

        {/* SPLIT PAYMENT VIEW */}
        {paymentMethod === 'Split' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cash (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={splitCash}
                  onChange={(e) => setSplitCash(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">UPI (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={splitUpi}
                  onChange={(e) => setSplitUpi(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Card (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={splitCard}
                  onChange={(e) => setSplitCard(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Tendered: ₹{splitTotal}</span>
              {splitDifference === 0 ? (
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                </span>
              ) : (
                <span className="font-bold text-rose-600">
                  Remaining: ₹{splitDifference}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bill Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Order / Bill Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Festival gift packing requested, altered size"
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all mt-2"
        >
          <span>Complete Sale & Generate Invoice</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};
