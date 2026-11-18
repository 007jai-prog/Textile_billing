/**
 * Default Store & Billing Configuration
 */

export const defaultSettings = {
  store: {
    storeName: 'Sri Meenakshi Silks & Textiles',
    tagline: 'Authentic South Indian Silks & Handlooms',
    address: '48, South Chithirai Street, Near Temple, Madurai',
    city: 'Madurai',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '625001',
    phone: '+91 452 2345678 / +91 98421 98421',
    email: 'billing@meenakshisilks.com',
    gstin: '33AABCS8899K1ZM',
    pan: 'AABCS8899K'
  },
  billing: {
    invoicePrefix: 'TEX-2026-',
    nextSequence: 1033,
    defaultGSTRate: 5,
    pricingMode: 'inclusive', // 'inclusive' | 'exclusive'
    defaultPaperSize: '80mm', // '80mm' | '58mm' | 'A4'
    defaultPaymentMethod: 'Cash',
    enableRounding: true,
    cashierName: 'Sundar (Terminal 01)',
    termsAndConditions: '1. Goods once sold can be exchanged within 7 days in original condition with bill.\n2. Cut-length fabrics & wedding pure silk sarees are non-returnable.\n3. Please verify items before leaving the cash counter.\nThank you for shopping at Sri Meenakshi Silks!'
  },
  appearance: {
    theme: 'light'
  }
};
