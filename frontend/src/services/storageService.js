import { mockProducts } from '../data/mockProducts';
import { mockCustomers } from '../data/mockCustomers';
import { mockInvoices } from '../data/mockInvoices';
import { defaultSettings } from '../data/mockSettings';

const STORAGE_KEYS = {
  PRODUCTS: 'texbill_products_v1',
  CUSTOMERS: 'texbill_customers_v1',
  INVOICES: 'texbill_invoices_v1',
  SETTINGS: 'texbill_settings_v1',
};

/**
 * Initialize storage with mock data if not already seeded
 */
export const initializeStorage = () => {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mockProducts));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(mockInvoices));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
  } catch (error) {
    console.error('Failed to initialize LocalStorage:', error);
  }
};

export const storageService = {
  getProducts: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : mockProducts;
    } catch (e) {
      return mockProducts;
    }
  },
  saveProducts: (products) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCustomers: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : mockCustomers;
    } catch (e) {
      return mockCustomers;
    }
  },
  saveCustomers: (customers) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getInvoices: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return data ? JSON.parse(data) : mockInvoices;
    } catch (e) {
      return mockInvoices;
    }
  },
  saveInvoices: (invoices) => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },

  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  },
  saveSettings: (settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  resetDemoData: () => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mockProducts));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(mockInvoices));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    return {
      products: mockProducts,
      customers: mockCustomers,
      invoices: mockInvoices,
      settings: defaultSettings,
    };
  }
};
