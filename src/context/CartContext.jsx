import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import confetti from 'canvas-confetti';
import { useApp } from './AppContext';
import { calculateCartTotals } from '../utils/calculations';
import { billingService } from '../services/billingService';
import { couponService } from '../services/couponService';
import { festivalService } from '../services/festivalService';

const CartContext = createContext();

export const defaultWalkInCustomer = {
  id: 'walk-in',
  name: 'Walk-in Customer',
  phone: '9840000000',
  city: 'Local',
  state: 'Tamil Nadu',
  gstin: '',
};

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getProductPrice = (product, variant) => {
  const variantPrice = Number(variant?.price);

  if (variant?.priceOverride === true && Number.isFinite(variantPrice)) {
    return Math.max(0, variantPrice);
  }

  return Math.max(0, toFiniteNumber(product?.price));
};

const getProductMrp = (product, variant) => {
  const variantMrp = Number(variant?.mrp);

  if (variant?.mrpOverride === true && Number.isFinite(variantMrp)) {
    return Math.max(0, variantMrp);
  }

  return Math.max(0, toFiniteNumber(product?.mrp));
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  const detail = data?.detail ?? data?.message ?? data?.error;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg || item?.message || String(item))
      .filter(Boolean);

    if (messages.length) return messages.join(', ');
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (error?.response?.status) {
    return `Coupon validation failed (HTTP ${error.response.status}).`;
  }

  if (error?.request) {
    return 'Could not reach the server to validate the coupon.';
  }

  return 'Could not validate the coupon. Please try again.';
};

export const CartProvider = ({ children }) => {
  const { products = [], settings, addInvoice, showToast } = useApp();

  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState(defaultWalkInCustomer);
  const [billDiscount, setBillDiscount] = useState({
    type: 'fixed',
    value: 0,
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedFestival, setAppliedFestival] = useState(null);
  const [isCheckingFestival, setIsCheckingFestival] = useState(false);
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTaxInclusive = settings?.billing?.pricingMode !== 'exclusive';

  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    setCartItems((currentItems) => {
      let hasChanges = false;

      const updatedItems = currentItems.map((cartItem) => {
        if (cartItem.manualPriceOverride) return cartItem;

        const product = products.find(
          (entry) => String(entry.id) === String(cartItem.productId),
        );

        if (!product) return cartItem;

        const variant = (product.variants || []).find(
          (entry) => String(entry.id) === String(cartItem.id),
        );

        const nextPrice = getProductPrice(product, variant);
        const nextMrp = getProductMrp(product, variant);
        const nextGstRate = toFiniteNumber(product.gstRate, 5);

        if (
          Number(cartItem.unitPrice) === nextPrice &&
          Number(cartItem.mrp) === nextMrp &&
          Number(cartItem.gstRate) === nextGstRate
        ) {
          return cartItem;
        }

        hasChanges = true;

        return {
          ...cartItem,
          unitPrice: nextPrice,
          mrp: nextMrp,
          gstRate: nextGstRate,
        };
      });

      return hasChanges ? updatedItems : currentItems;
    });
  }, [products]);

  const rawSubtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const quantity = Math.max(0, toFiniteNumber(item.quantity, 1));
        const unitPrice = Math.max(0, toFiniteNumber(item.unitPrice));
        const gross = quantity * unitPrice;

        let discount = 0;

        if (item.discountType === 'percent') {
          const percent = Math.min(
            100,
            Math.max(0, toFiniteNumber(item.discountValue)),
          );
          discount = (gross * percent) / 100;
        } else {
          discount = Math.min(
            gross,
            Math.max(0, toFiniteNumber(item.discountValue)),
          );
        }

        return total + Math.max(0, gross - discount);
      }, 0),
    [cartItems],
  );

  useEffect(() => {
    let isMounted = true;

    if (rawSubtotal <= 0) {
      setAppliedFestival(null);
      setIsCheckingFestival(false);
      return undefined;
    }

    const checkFestival = async () => {
      try {
        setIsCheckingFestival(true);

        const response = await festivalService.checkActiveOffer(rawSubtotal);

        if (!isMounted) return;

        if (response?.has_active_offer && response?.offer) {
          setAppliedFestival({
            ...response.offer,
            calculated_discount: response.calculated_discount || 0,
          });
        } else {
          setAppliedFestival(null);
        }
      } catch {
        if (isMounted) setAppliedFestival(null);
      } finally {
        if (isMounted) setIsCheckingFestival(false);
      }
    };

    const timeout = window.setTimeout(checkFestival, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [rawSubtotal]);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon || rawSubtotal <= 0) return 0;

    const minimumBill = toFiniteNumber(appliedCoupon.min_bill_amount);
    if (minimumBill > 0 && rawSubtotal < minimumBill) return 0;

    const discountValue = Math.max(
      0,
      toFiniteNumber(appliedCoupon.discount_value),
    );

    let discount = 0;

    if (appliedCoupon.discount_type === 'percent') {
      discount = (rawSubtotal * discountValue) / 100;

      const cap = toFiniteNumber(appliedCoupon.max_discount_amount);
      if (cap > 0) discount = Math.min(discount, cap);
    } else {
      discount = Math.min(rawSubtotal, discountValue);
    }

    return Math.round((discount + Number.EPSILON) * 100) / 100;
  }, [appliedCoupon, rawSubtotal]);

  const festivalDiscountAmount = useMemo(() => {
    if (!appliedFestival || rawSubtotal <= 0) return 0;

    const discountValue = Math.max(
      0,
      toFiniteNumber(appliedFestival.discount_value),
    );

    let discount = 0;

    if (appliedFestival.discount_type === 'percent') {
      discount = (rawSubtotal * discountValue) / 100;

      const cap = toFiniteNumber(appliedFestival.max_discount_amount);
      if (cap > 0) discount = Math.min(discount, cap);
    } else {
      discount = Math.min(rawSubtotal, discountValue);
    }

    return Math.round((discount + Number.EPSILON) * 100) / 100;
  }, [appliedFestival, rawSubtotal]);

  const cartTotals = useMemo(
    () =>
      calculateCartTotals(
        cartItems,
        billDiscount,
        isTaxInclusive,
        couponDiscountAmount,
        festivalDiscountAmount,
      ),
    [
      cartItems,
      billDiscount,
      isTaxInclusive,
      couponDiscountAmount,
      festivalDiscountAmount,
    ],
  );

  const applyCoupon = useCallback(
    async (code) => {
      const normalizedCode = String(code || '').trim().toUpperCase();

      if (!normalizedCode) {
        const message = 'Please enter a coupon code.';
        showToast(message, 'error');
        return { success: false, error: message };
      }

      try {
        const response = await couponService.validateCoupon(
          normalizedCode,
          rawSubtotal,
          customer?.id && customer.id !== 'walk-in' ? customer.id : null,
        );

        if (response?.valid) {
          if (!response.coupon) {
            const message =
              'The server accepted the coupon but did not return coupon details.';
            showToast(message, 'error');
            return { success: false, error: message };
          }

          setAppliedCoupon(response.coupon);

          const discount = toFiniteNumber(response.discount_amount);
          showToast(
            `Coupon "${response.coupon.code || normalizedCode}" applied! Saved ₹${discount}`,
            'success',
          );

          return {
            success: true,
            coupon: response.coupon,
            discount,
          };
        }

        const message =
          response?.message ||
          response?.detail ||
          'This coupon is invalid or does not apply to this bill.';

        showToast(message, 'error');
        return { success: false, error: message };
      } catch (error) {
        const message = getErrorMessage(error);

        console.error('Coupon validation failed:', {
          message,
          status: error?.response?.status,
          response: error?.response?.data,
        });

        showToast(message, 'error');
        return { success: false, error: message };
      }
    },
    [customer, rawSubtotal, showToast],
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    showToast('Coupon removed.', 'info');
  }, [showToast]);

  const addToCart = useCallback(
    (variant, product, qty = 1) => {
      if (!variant || !product) return;

      const unitPrice = getProductPrice(product, variant);
      const mrp = getProductMrp(product, variant);
      const quantityToAdd = Math.max(1, toFiniteNumber(qty, 1));
      const variantId = variant.id;

      setCartItems((previousItems) => {
        const existingIndex = previousItems.findIndex(
          (item) => String(item.id) === String(variantId),
        );

        if (existingIndex !== -1) {
          return previousItems.map((item, index) => {
            if (index !== existingIndex) return item;

            return {
              ...item,
              unitPrice: item.manualPriceOverride ? item.unitPrice : unitPrice,
              mrp,
              quantity:
                Math.max(0, toFiniteNumber(item.quantity)) + quantityToAdd,
            };
          });
        }

        return [
          ...previousItems,
          {
            id: variantId,
            productId: product.id,
            name: product.name || '',
            sku: variant.sku || '',
            barcode: variant.barcode || '',
            size: variant.size || 'Free Size',
            color: variant.color || '',
            hex: variant.hex || '#6366f1',
            fabric: product.fabric || '',
            brand: product.brand || '',
            hsn: product.hsn || '6204',
            unitPrice,
            mrp,
            gstRate: toFiniteNumber(product.gstRate, 5),
            quantity: quantityToAdd,
            discountType: 'fixed',
            discountValue: 0,
            manualPriceOverride: false,
          },
        ];
      });

      showToast(
        `Added ${product.name || 'Product'} (${variant.size || 'Free Size'}) to cart.`,
        'success',
      );
    },
    [showToast],
  );

  const updateQuantity = useCallback(
    (itemId, newQuantity) => {
      const quantity = Number(newQuantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setCartItems((items) =>
          items.filter((item) => String(item.id) !== String(itemId)),
        );
        return;
      }

      setCartItems((items) =>
        items.map((item) =>
          String(item.id) === String(itemId)
            ? { ...item, quantity }
            : item,
        ),
      );
    },
    [],
  );

  const updateUnitPrice = useCallback((itemId, newPrice) => {
    const price = Math.max(0, toFiniteNumber(newPrice));

    setCartItems((items) =>
      items.map((item) =>
        String(item.id) === String(itemId)
          ? {
              ...item,
              unitPrice: price,
              manualPriceOverride: true,
            }
          : item,
      ),
    );
  }, []);

  const updateItemDiscount = useCallback(
    (itemId, discountType, discountValue) => {
      const value = Math.max(0, toFiniteNumber(discountValue));

      setCartItems((items) =>
        items.map((item) =>
          String(item.id) === String(itemId)
            ? { ...item, discountType, discountValue: value }
            : item,
        ),
      );
    },
    [],
  );

  const removeFromCart = useCallback((itemId) => {
    setCartItems((items) =>
      items.filter((item) => String(item.id) !== String(itemId)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setBillDiscount({ type: 'fixed', value: 0 });
    setAppliedCoupon(null);
    setAppliedFestival(null);
    setCustomer(defaultWalkInCustomer);
  }, []);

  const completeCheckout = async (
    paymentMethod,
    paymentData = {},
    notes = '',
  ) => {
    if (cartItems.length === 0) {
      showToast('Cannot checkout an empty cart.', 'error');
      return { success: false, error: 'Empty cart' };
    }

    const validation = billingService.validatePayment(
      cartTotals.netPayable,
      paymentMethod,
      paymentData,
    );

    if (!validation.valid) {
      showToast(validation.error, 'error');
      return { success: false, error: validation.error };
    }

    setIsSubmitting(true);

    try {
      const invoicePayload = {
        customer: customer || defaultWalkInCustomer,
        items: (cartTotals.processedItems || cartItems).map((item) => ({
          id: String(item.id),
          productId: String(item.productId),
          name: item.name,
          sku: item.sku || '',
          barcode: item.barcode || '',
          size: item.size || 'Free Size',
          color: item.color || '',
          fabric: item.fabric || '',
          quantity: toFiniteNumber(item.quantity, 1),
          unitPrice: toFiniteNumber(item.unitPrice),
          grossAmount:
            toFiniteNumber(item.grossAmount) ||
            toFiniteNumber(item.quantity) * toFiniteNumber(item.unitPrice),
          discountType: item.discountType || 'fixed',
          discountValue: toFiniteNumber(item.discountValue),
          itemDiscountAmount: toFiniteNumber(item.itemDiscountAmount),
          gstRate: toFiniteNumber(item.gstRate, 5),
          taxableAmount: toFiniteNumber(item.taxableAmount),
          taxAmount: toFiniteNumber(item.taxAmount),
          cgstRate:
            toFiniteNumber(item.cgstRate) ||
            toFiniteNumber(item.gstRate, 5) / 2,
          cgstAmount: toFiniteNumber(item.cgstAmount),
          sgstRate:
            toFiniteNumber(item.sgstRate) ||
            toFiniteNumber(item.gstRate, 5) / 2,
          sgstAmount: toFiniteNumber(item.sgstAmount),
          lineTotal: toFiniteNumber(item.lineTotal),
        })),
        billDiscount,
        coupon_code: appliedCoupon?.code || null,
        payment: {
          method: paymentMethod,
          reference: paymentData.reference || '',
          amountReceived:
            toFiniteNumber(paymentData.amountReceived) ||
            cartTotals.netPayable,
          changeReturned: toFiniteNumber(validation.changeReturned),
          splitDetails: paymentData.splitDetails || null,
        },
        notes: notes || '',
      };

      const savedInvoice = await addInvoice(invoicePayload);
      setLastCompletedInvoice(savedInvoice);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // no-op
      }

      clearCart();
      setIsCheckoutOpen(false);
      setIsSuccessOpen(true);

      showToast(
        `Invoice ${savedInvoice.invoiceNumber} completed successfully!`,
        'success',
      );

      return { success: true, invoice: savedInvoice };
    } catch (error) {
      console.error('Checkout error:', error);
      const message = error?.message || 'Invoice checkout failed.';
      showToast(message, 'error');
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        customer,
        setCustomer,
        billDiscount,
        setBillDiscount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        appliedFestival,
        isCheckingFestival,
        cartTotals,
        addToCart,
        updateQuantity,
        updateUnitPrice,
        updateItemDiscount,
        removeFromCart,
        clearCart,
        completeCheckout,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isSuccessOpen,
        setIsSuccessOpen,
        isSubmitting,
        lastCompletedInvoice,
        setLastCompletedInvoice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};