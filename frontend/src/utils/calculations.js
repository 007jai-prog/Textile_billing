/**
 * Utility functions for decimal-safe monetary and tax calculations.
 * Supports both tax-inclusive and tax-exclusive pricing models.
 */

export const round2 = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate line item values:
 * - qty, unitPrice, discountType ('percent' | 'fixed'), discountValue, gstRate
 */
export const calculateLineItem = (item, isTaxInclusive = true) => {
  const qty = Number(item.quantity) || 1;
  const unitPrice = Number(item.unitPrice) || 0;
  const gstRate = Number(item.gstRate || 5); // default 5% for textiles
  
  const grossAmount = qty * unitPrice;
  
  // Calculate Item Discount
  let itemDiscountAmount = 0;
  if (item.discountType === 'percent') {
    const percent = Math.min(100, Math.max(0, Number(item.discountValue) || 0));
    itemDiscountAmount = (grossAmount * percent) / 100;
  } else if (item.discountType === 'fixed') {
    itemDiscountAmount = Math.min(grossAmount, Number(item.discountValue) || 0);
  }
  itemDiscountAmount = round2(itemDiscountAmount);
  
  const effectiveAmount = Math.max(0, grossAmount - itemDiscountAmount);
  
  let taxableAmount = 0;
  let taxAmount = 0;
  let lineTotal = 0;

  if (isTaxInclusive) {
    // If tax inclusive: effectiveAmount = taxableAmount + (taxableAmount * gstRate / 100)
    // taxableAmount = effectiveAmount / (1 + gstRate / 100)
    taxableAmount = round2(effectiveAmount / (1 + gstRate / 100));
    taxAmount = round2(effectiveAmount - taxableAmount);
    lineTotal = round2(effectiveAmount);
  } else {
    // If tax exclusive: taxableAmount = effectiveAmount
    taxableAmount = round2(effectiveAmount);
    taxAmount = round2((taxableAmount * gstRate) / 100);
    lineTotal = round2(taxableAmount + taxAmount);
  }

  // Dual GST split for intra-state: CGST = half, SGST = half
  const cgstRate = gstRate / 2;
  const sgstRate = gstRate / 2;
  const cgstAmount = round2(taxAmount / 2);
  const sgstAmount = round2(taxAmount - cgstAmount); // to avoid 1 paisa rounding drift

  return {
    ...item,
    grossAmount: round2(grossAmount),
    itemDiscountAmount,
    taxableAmount,
    taxAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    lineTotal
  };
};

/**
 * Calculate comprehensive cart totals
 */
export const calculateCartTotals = (
  items = [],
  billDiscount = { type: 'fixed', value: 0 },
  isTaxInclusive = true,
  couponDiscount = 0,
  festivalDiscount = 0
) => {
  if (!items || items.length === 0) {
    return {
      totalItems: 0,
      totalQuantity: 0,
      grossSubtotal: 0,
      totalItemDiscount: 0,
      billDiscountAmount: 0,
      couponDiscountAmount: 0,
      festivalDiscountAmount: 0,
      totalDiscount: 0,
      taxableSubtotal: 0,
      totalTax: 0,
      totalCGST: 0,
      totalSGST: 0,
      grandTotal: 0,
      roundOff: 0,
      netPayable: 0,
      taxBreakup: [],
      processedItems: []
    };
  }

  let totalQuantity = 0;
  let grossSubtotal = 0;
  let totalItemDiscount = 0;
  
  // First pass: line items
  const processedItems = items.map(item => {
    const calculated = calculateLineItem(item, isTaxInclusive);
    totalQuantity += calculated.quantity;
    grossSubtotal += calculated.grossAmount;
    totalItemDiscount += calculated.itemDiscountAmount;
    return calculated;
  });

  const subtotalAfterItemDiscounts = Math.max(0, grossSubtotal - totalItemDiscount);

  // Bill-level discount calculation
  let billDiscountAmount = 0;
  if (billDiscount.type === 'percent') {
    const percent = Math.min(100, Math.max(0, Number(billDiscount.value) || 0));
    billDiscountAmount = (subtotalAfterItemDiscounts * percent) / 100;
  } else {
    billDiscountAmount = Math.min(subtotalAfterItemDiscounts, Number(billDiscount.value) || 0);
  }
  billDiscountAmount = round2(billDiscountAmount);

  const couponDisc = round2(Math.min(Math.max(0, subtotalAfterItemDiscounts - billDiscountAmount), Number(couponDiscount) || 0));
  const festivalDisc = round2(Math.min(Math.max(0, subtotalAfterItemDiscounts - billDiscountAmount - couponDisc), Number(festivalDiscount) || 0));

  const totalAdditionalDiscounts = billDiscountAmount + couponDisc + festivalDisc;

  // Distribute total additional discounts proportionally across items for accurate GST breakdown
  const discountRatio = subtotalAfterItemDiscounts > 0 
    ? Math.max(0, subtotalAfterItemDiscounts - totalAdditionalDiscounts) / subtotalAfterItemDiscounts 
    : 1;

  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalTax = 0;

  // Track breakdown by GST rate (e.g. 5%, 12%, 18%)
  const taxRateMap = {};

  processedItems.forEach(item => {
    const netLine = round2(item.grossAmount - item.itemDiscountAmount) * discountRatio;
    const rate = Number(item.gstRate) || 5;

    let itemTaxable = 0;
    let itemTax = 0;

    if (isTaxInclusive) {
      itemTaxable = round2(netLine / (1 + rate / 100));
      itemTax = round2(netLine - itemTaxable);
    } else {
      itemTaxable = round2(netLine);
      itemTax = round2((itemTaxable * rate) / 100);
    }

    const itemCgst = round2(itemTax / 2);
    const itemSgst = round2(itemTax - itemCgst);

    totalTaxable += itemTaxable;
    totalCGST += itemCgst;
    totalSGST += itemSgst;
    totalTax += itemTax;

    if (!taxRateMap[rate]) {
      taxRateMap[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
    }
    taxRateMap[rate].taxable = round2(taxRateMap[rate].taxable + itemTaxable);
    taxRateMap[rate].cgst = round2(taxRateMap[rate].cgst + itemCgst);
    taxRateMap[rate].sgst = round2(taxRateMap[rate].sgst + itemSgst);
    taxRateMap[rate].totalTax = round2(taxRateMap[rate].totalTax + itemTax);
  });

  totalTaxable = round2(totalTaxable);
  totalCGST = round2(totalCGST);
  totalSGST = round2(totalSGST);
  totalTax = round2(totalTax);

  let rawGrandTotal = 0;
  if (isTaxInclusive) {
    rawGrandTotal = round2(subtotalAfterItemDiscounts - totalAdditionalDiscounts);
  } else {
    rawGrandTotal = round2(totalTaxable + totalTax);
  }

  const roundedNetPayable = Math.max(0, Math.round(rawGrandTotal));
  const roundOff = round2(roundedNetPayable - rawGrandTotal);

  return {
    totalItems: items.length,
    totalQuantity,
    grossSubtotal: round2(grossSubtotal),
    totalItemDiscount: round2(totalItemDiscount),
    billDiscountAmount,
    couponDiscountAmount: couponDisc,
    festivalDiscountAmount: festivalDisc,
    totalDiscount: round2(totalItemDiscount + totalAdditionalDiscounts),
    taxableSubtotal: totalTaxable,
    totalTax,
    totalCGST,
    totalSGST,
    grandTotal: rawGrandTotal,
    roundOff,
    netPayable: roundedNetPayable,
    taxBreakup: Object.values(taxRateMap),
    processedItems
  };
};
