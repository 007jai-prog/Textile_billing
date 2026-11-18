import dayjs from 'dayjs';
import { round2 } from '../utils/calculations';

export const billingService = {
  /**
   * Generates next invoice number based on store settings
   */
  generateInvoiceNumber: (prefix = 'TEX-2026-', sequence = 1001) => {
    return `${prefix}${String(sequence).padStart(4, '0')}`;
  },

  /**
   * Validates checkout payment details
   */
  validatePayment: (netPayable, paymentMethod, paymentData) => {
    const payable = round2(netPayable);

    if (paymentMethod === 'Cash') {
      const received = Number(paymentData.amountReceived) || 0;
      if (received < payable) {
        return {
          valid: false,
          error: `Tendered amount (₹${received}) cannot be less than total payable (₹${payable}).`
        };
      }
      return {
        valid: true,
        changeReturned: round2(received - payable)
      };
    }

    if (paymentMethod === 'UPI') {
      return {
        valid: true,
        changeReturned: 0,
        reference: paymentData.reference || `UPI/POS/${Date.now().toString().slice(-6)}`
      };
    }

    if (paymentMethod === 'Card') {
      return {
        valid: true,
        changeReturned: 0,
        reference: paymentData.reference || `CARD/APPR/${Date.now().toString().slice(-4)}`
      };
    }

    if (paymentMethod === 'Split') {
      const split = paymentData.splitDetails || { cash: 0, upi: 0, card: 0 };
      const sum = round2(
        (Number(split.cash) || 0) + (Number(split.upi) || 0) + (Number(split.card) || 0)
      );

      if (Math.abs(sum - payable) > 0.5) {
        return {
          valid: false,
          error: `Split sum (₹${sum}) does not equal total payable (₹${payable}). Difference: ₹${round2(payable - sum)}`
        };
      }

      return {
        valid: true,
        changeReturned: 0,
        reference: `Split: Cash ₹${split.cash || 0}, UPI ₹${split.upi || 0}, Card ₹${split.card || 0}`
      };
    }

    return { valid: true, changeReturned: 0 };
  },

  /**
   * Assemble full invoice object ready for saving and printing
   */
  createInvoiceRecord: ({
    invoiceNumber,
    customer,
    calculatedCart,
    paymentMethod,
    paymentData,
    settings,
    notes = ''
  }) => {
    const now = new Date().toISOString();

    const invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: now,
      customer: customer ? {
        id: customer.id || 'walk-in',
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone || '9840000000',
        city: customer.city || 'Local',
        state: customer.state || 'Tamil Nadu',
        gstin: customer.gstin || '',
        address: customer.address || ''
      } : {
        id: 'walk-in',
        name: 'Walk-in Customer',
        phone: '9840000000',
        city: 'Local',
        state: 'Tamil Nadu',
        gstin: '',
        address: ''
      },
      items: calculatedCart.processedItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        fabric: item.fabric,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        grossAmount: item.grossAmount,
        discountType: item.discountType || 'fixed',
        discountValue: item.discountValue || 0,
        itemDiscountAmount: item.itemDiscountAmount,
        gstRate: item.gstRate,
        taxableAmount: item.taxableAmount,
        taxAmount: item.taxAmount,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        lineTotal: item.lineTotal
      })),
      summary: {
        totalItems: calculatedCart.totalItems,
        totalQuantity: calculatedCart.totalQuantity,
        grossSubtotal: calculatedCart.grossSubtotal,
        totalItemDiscount: calculatedCart.totalItemDiscount,
        billDiscountAmount: calculatedCart.billDiscountAmount,
        totalDiscount: calculatedCart.totalDiscount,
        taxableSubtotal: calculatedCart.taxableSubtotal,
        totalTax: calculatedCart.totalTax,
        totalCGST: calculatedCart.totalCGST,
        totalSGST: calculatedCart.totalSGST,
        grandTotal: calculatedCart.grandTotal,
        roundOff: calculatedCart.roundOff,
        netPayable: calculatedCart.netPayable,
        taxBreakup: calculatedCart.taxBreakup || []
      },
      payment: {
        method: paymentMethod,
        reference: paymentData.reference || '',
        amountReceived: Number(paymentData.amountReceived) || calculatedCart.netPayable,
        changeReturned: Number(paymentData.changeReturned) || 0,
        splitDetails: paymentMethod === 'Split' ? paymentData.splitDetails : null
      },
      cashier: settings?.billing?.cashierName || 'Cashier (POS-01)',
      notes: notes || '',
      status: 'Completed'
    };

    return invoice;
  }
};
