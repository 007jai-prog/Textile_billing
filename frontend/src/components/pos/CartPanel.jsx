import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  AlertCircle,
  Barcode,
  Camera,
  Check,
  CreditCard,
  Edit2,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

const normalizeBarcode = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();

const getCameraErrorMessage = (error) => {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera permission was denied. Allow camera access in your browser settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The camera may be in use by another app. Close that app and try again.';
    case 'SecurityError':
      return 'Camera access requires HTTPS or localhost.';
    default:
      return error?.message || 'Could not start the camera. Please try again.';
  }
};

export const CartPanel = ({ onOpenCustomerModal, onOpenPaymentModal }) => {
  const { products = [], showToast } = useApp();

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
    addToCart,
    updateQuantity,
    updateUnitPrice,
    updateItemDiscount,
    removeFromCart,
    clearCart,
  } = useCart();

  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [tempDiscountType, setTempDiscountType] = useState('fixed');
  const [tempDiscountVal, setTempDiscountVal] = useState('');

  const [isBillDiscountOpen, setIsBillDiscountOpen] = useState(false);
  const [billDiscType, setBillDiscType] = useState(
    billDiscount.type || 'fixed',
  );
  const [billDiscVal, setBillDiscVal] = useState(billDiscount.value || 0);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isCouponOpen, setIsCouponOpen] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const scannerControlsRef = useRef(null);
  const scanHandledRef = useRef(false);
  const barcodeHandlerRef = useRef(null);

  const handleBarcodeDetected = (rawCode) => {
    const scannedCode = normalizeBarcode(rawCode);

    if (!scannedCode) {
      showToast('No barcode was read. Please try again.', 'error');
      return;
    }

    const variantMatches = [];

    for (const product of products) {
      for (const variant of product.variants || []) {
        if (normalizeBarcode(variant.barcode) === scannedCode) {
          variantMatches.push({ product, variant });
        }
      }
    }

    if (variantMatches.length === 1) {
      const { product, variant } = variantMatches[0];
      addToCart(variant, product, 1);
      return;
    }

    if (variantMatches.length > 1) {
      showToast(
        'This barcode is assigned to multiple variants. Correct the duplicate barcode before scanning.',
        'error',
      );
      return;
    }

    const productMatches = products.filter(
      (product) => normalizeBarcode(product.barcode) === scannedCode,
    );

    if (productMatches.length > 1) {
      showToast(
        'This barcode is assigned to multiple products. Correct the duplicate barcode before scanning.',
        'error',
      );
      return;
    }

    if (productMatches.length === 1) {
      const product = productMatches[0];
      const variants = product.variants || [];

      if (variants.length === 1) {
        addToCart(variants[0], product, 1);
      } else if (variants.length > 1) {
        showToast(
          'This product has multiple variants. Scan a unique barcode assigned to a specific variant.',
          'error',
        );
      } else {
        showToast(
          'This product has no selectable variant and could not be added.',
          'error',
        );
      }

      return;
    }

    showToast(`No product found for barcode "${rawCode}".`, 'error');
  };

  // Keep the scanner callback up to date without restarting the camera.
  barcodeHandlerRef.current = handleBarcodeDetected;

  useEffect(() => {
    if (!isScannerOpen) return undefined;

    let disposed = false;
    scanHandledRef.current = false;
    setCameraError('');
    setCameraStatus('Requesting camera access…');

    const videoElement = videoRef.current;

    if (!videoElement) {
      setCameraError('The camera preview could not be initialized.');
      return undefined;
    }

    const reader = new BrowserMultiFormatReader();

    const startCamera = async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          videoElement,
          (result, _error, callbackControls) => {
            if (disposed || !result || scanHandledRef.current) return;

            scanHandledRef.current = true;
            setCameraStatus('Barcode detected.');

            const controlsToStop =
              callbackControls || scannerControlsRef.current;

            controlsToStop?.stop();
            scannerControlsRef.current = null;

            barcodeHandlerRef.current?.(result.getText());
            setIsScannerOpen(false);
          },
        );

        if (disposed) {
          controls.stop();
          return;
        }

        scannerControlsRef.current = controls;
        setCameraStatus('Point the camera at a barcode and hold it steady.');
      } catch (error) {
        if (!disposed) {
          setCameraError(getCameraErrorMessage(error));
          setCameraStatus('');
        }
      }
    };

    startCamera();

    return () => {
      disposed = true;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [isScannerOpen]);

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

  const handleApplyBillDiscount = (event) => {
    event.preventDefault();
    setBillDiscount({
      type: billDiscType,
      value: Number(billDiscVal) || 0,
    });
    setIsBillDiscountOpen(false);
  };

  const handleApplyCoupon = async (event) => {
    event.preventDefault();

    if (!couponCodeInput.trim()) return;

    const result = await applyCoupon(couponCodeInput.trim());

    // Keep the form open if validation failed so the customer/cashier can
    // correct the code. CartContext's applyCoupon returns { success }.
    if (result?.success) {
      setIsCouponOpen(false);
      setCouponCodeInput('');
    }
  };

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-theme-card shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
      }}
    >
      {/* Header and customer selection */}
      <div
        className="flex items-center justify-between border-b p-3.5 transition-colors"
        style={{
          backgroundColor: 'var(--theme-primary-light)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-primary)',
            }}
          >
            <User className="h-4 w-4" />
          </div>

          <div className="truncate">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Customer
            </span>
            <h4 className="truncate text-xs font-bold text-slate-900">
              {customer?.name || 'Walk-in Customer'}
            </h4>
            {customer?.phone && customer?.id !== 'walk-in' && (
              <span className="font-mono text-[10px] text-slate-500">
                {customer.phone}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCustomerModal}
          className="flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors"
          style={{
            color: 'var(--theme-primary)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <span>Change</span>
          <kbd className="hidden rounded bg-slate-100 px-1 font-mono text-[9px] sm:inline-block">
            F4
          </kbd>
        </button>
      </div>

      {/* Camera scanner action */}
      <div className="border-b border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            setCameraError('');
            setCameraStatus('Starting camera…');
            setIsScannerOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          style={{
            backgroundColor: 'var(--theme-primary-light)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-primary)',
          }}
        >
          <Barcode className="h-4 w-4" aria-hidden="true" />
          <span>Scan barcode</span>
          <Camera className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Cart items */}
      <div className="flex-1 divide-y divide-slate-100 space-y-2.5 overflow-y-auto p-3">
        {cartItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <ShoppingBag className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-600">Cart is empty</p>
            <p className="mt-1 max-w-[180px] text-[11px] text-slate-400">
              Scan a barcode or search for products to add them to this bill.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="pt-2.5 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h5 className="line-clamp-1 text-xs font-bold text-slate-900">
                    {item.name}
                  </h5>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                      {item.size}
                    </span>
                    {item.color && (
                      <span className="flex items-center gap-1">
                        {item.hex && (
                          <span
                            className="inline-block h-2 w-2 rounded-full border border-slate-300"
                            style={{ backgroundColor: item.hex }}
                          />
                        )}
                        {item.color}
                      </span>
                    )}
                    <span>• GST {item.gstRate}%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 text-slate-300 transition-colors hover:text-rose-500"
                  title="Remove item"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="text-right">
                  {editingPriceId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tempPrice}
                        onChange={(event) => setTempPrice(event.target.value)}
                        className="w-16 rounded border border-indigo-400 px-1.5 py-0.5 text-xs font-bold focus:outline-none"
                        autoFocus
                        aria-label="Edit unit price"
                      />
                      <button
                        type="button"
                        onClick={() => saveEditPrice(item.id)}
                        className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                        aria-label="Save unit price"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditPrice(item)}
                        className="p-0.5 text-slate-400 hover:text-indigo-600"
                        title="Edit unit price"
                        aria-label={`Edit ${item.name} price`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <div className="mt-0.5 flex items-center justify-end gap-1">
                    {editingDiscountId === item.id ? (
                      <div className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 p-1">
                        <select
                          value={tempDiscountType}
                          onChange={(event) =>
                            setTempDiscountType(event.target.value)
                          }
                          className="rounded border border-slate-300 bg-white text-[10px]"
                          aria-label="Discount type"
                        >
                          <option value="fixed">₹</option>
                          <option value="percent">%</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tempDiscountVal}
                          onChange={(event) =>
                            setTempDiscountVal(event.target.value)
                          }
                          className="w-12 rounded border border-slate-300 px-1 py-0.5 text-[10px] font-bold"
                          aria-label="Discount value"
                        />
                        <button
                          type="button"
                          onClick={() => saveEditDiscount(item.id)}
                          className="p-0.5 font-bold text-emerald-700"
                          aria-label="Save item discount"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditDiscount(item)}
                        className={`flex items-center gap-0.5 text-[10px] font-medium ${
                          item.discountValue > 0
                            ? 'font-bold text-emerald-600'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        <span>
                          {item.discountValue > 0
                            ? `Disc -${
                                item.discountType === 'percent'
                                  ? `${item.discountValue}%`
                                  : `₹${item.discountValue}`
                              }`
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

      {/* Totals and checkout */}
      <div className="space-y-2 border-t border-slate-200/90 bg-slate-50 p-3.5">
        {appliedFestival && (
          <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 p-2 text-[11px] font-medium text-amber-900">
            <span className="truncate">
              {appliedFestival.banner_text ||
                `🎉 ${appliedFestival.festival_name} Active`}
            </span>
            <span className="ml-1 shrink-0 font-bold">
              -{formatCurrency(cartTotals.festivalDiscountAmount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBillDiscountOpen(!isBillDiscountOpen)}
              className="flex items-center gap-1 font-medium text-slate-600 hover:text-indigo-600"
            >
              <Tag className="h-3.5 w-3.5 text-indigo-500" />
              <span>
                Bill Disc{' '}
                {billDiscount.value > 0 &&
                  `(${
                    billDiscount.type === 'percent'
                      ? `${billDiscount.value}%`
                      : `₹${billDiscount.value}`
                  })`}
              </span>
            </button>

            <span className="text-slate-300">•</span>

            {!appliedCoupon ? (
              <button
                type="button"
                onClick={() => setIsCouponOpen(!isCouponOpen)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>+ Coupon</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                <span>{appliedCoupon.code}</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-[10px] hover:text-rose-600"
                  title="Remove coupon"
                  aria-label="Remove coupon"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {cartTotals.totalDiscount > 0 && (
            <span className="font-bold text-emerald-600">
              - {formatCurrency(cartTotals.totalDiscount)}
            </span>
          )}
        </div>

        {isCouponOpen && !appliedCoupon && (
          <form
            onSubmit={handleApplyCoupon}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white p-2 shadow-sm"
          >
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCodeInput}
              onChange={(event) =>
                setCouponCodeInput(event.target.value.toUpperCase())
              }
              className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-xs font-bold uppercase"
              aria-label="Coupon code"
            />
            <button
              type="submit"
              className="shrink-0 rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white"
            >
              Apply
            </button>
          </form>
        )}

        {isBillDiscountOpen && (
          <form
            onSubmit={handleApplyBillDiscount}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white p-2 shadow-sm"
          >
            <select
              value={billDiscType}
              onChange={(event) => setBillDiscType(event.target.value)}
              className="rounded border border-slate-300 bg-slate-50 px-1.5 py-1 text-xs"
              aria-label="Bill discount type"
            >
              <option value="fixed">Fixed ₹</option>
              <option value="percent">Percent %</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={billDiscVal}
              onChange={(event) => setBillDiscVal(event.target.value)}
              placeholder="Discount value"
              className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold"
              aria-label="Bill discount value"
            />
            <button
              type="submit"
              className="shrink-0 rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white"
            >
              Apply
            </button>
          </form>
        )}

        <div className="space-y-1 border-t border-slate-200/60 pt-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal ({cartTotals.totalQuantity} items):</span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(cartTotals.grossSubtotal)}
            </span>
          </div>

          {cartTotals.couponDiscountAmount > 0 && (
            <div className="flex justify-between font-medium text-indigo-600">
              <span>Coupon ({appliedCoupon?.code}):</span>
              <span>- {formatCurrency(cartTotals.couponDiscountAmount)}</span>
            </div>
          )}

          {cartTotals.festivalDiscountAmount > 0 && (
            <div className="flex justify-between font-medium text-amber-700">
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
              <span>
                {cartTotals.roundOff > 0 ? '+' : ''}
                {formatCurrency(cartTotals.roundOff)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between border-t border-slate-300 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Net Payable
          </span>
          <span
            className="text-xl font-extrabold"
            style={{ color: 'var(--theme-primary)' }}
          >
            {formatCurrency(cartTotals.netPayable)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={() => {
              if (window.confirm('Clear all items from this cart?')) {
                clearCart();
              }
            }}
            className="col-span-1 flex items-center justify-center rounded-xl bg-slate-200 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-300 disabled:opacity-40"
            title="Clear Cart"
            aria-label="Clear cart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={onOpenPaymentModal}
            className="col-span-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold text-white shadow-md transition-all disabled:opacity-40 sm:text-sm"
            style={{
              backgroundColor: 'var(--theme-primary)',
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
            }}
          >
            <CreditCard className="h-4 w-4" />
            <span>PAY (F8)</span>
            <span className="font-bold">
              • {formatCurrency(cartTotals.netPayable)}
            </span>
          </button>
        </div>
      </div>

      {/* Camera scanner dialog */}
      {isScannerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-barcode-scanner-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsScannerOpen(false);
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div>
                <h2
                  id="cart-barcode-scanner-title"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Scan product barcode
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Center the barcode in the frame and hold steady.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close barcode scanner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
                aria-label="Live camera preview for barcode scanning"
              />

              {!cameraError && (
                <div className="pointer-events-none absolute inset-[15%] rounded-xl border-2 border-indigo-400">
                  <span className="absolute left-1/2 top-1/2 h-0.5 w-[90%] -translate-x-1/2 -translate-y-1/2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="max-w-sm text-center text-white">
                    <AlertCircle className="mx-auto mb-3 h-8 w-8" />
                    <p className="text-sm font-semibold">{cameraError}</p>
                    <p className="mt-2 text-xs text-slate-300">
                      Allow camera access and use HTTPS or localhost.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p
                className="text-xs text-slate-600 dark:text-slate-300"
                role="status"
                aria-live="polite"
              >
                {cameraStatus}
              </p>

              {cameraError && (
                <button
                  type="button"
                  onClick={() => {
                    setIsScannerOpen(false);
                    window.setTimeout(() => {
                      setCameraError('');
                      setIsScannerOpen(true);
                    }, 0);
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};