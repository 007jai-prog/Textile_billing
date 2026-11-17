import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { invoiceService } from '../services/invoiceService';
import { settingsService } from '../services/settingsService';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loadProducts = useCallback(async (filters = {}) => {
    try {
      const data = await productService.getProducts(filters);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  const loadCustomers = useCallback(async (search = '') => {
    try {
      const data = await customerService.getCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }, []);

  const loadInvoices = useCallback(async (filters = {}) => {
    try {
      const data = await invoiceService.getInvoices(filters);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  // When authenticated, load store data from the backend.
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingData(true);
      Promise.all([
        loadProducts(),
        loadCustomers(),
        loadInvoices(),
        loadSettings()
      ]).finally(() => {
        setIsLoadingData(false);
      });
    } else {
      setProducts([]);
      setCustomers([]);
      setInvoices([]);
      setSettings(null);
    }
  }, [isAuthenticated, loadProducts, loadCustomers, loadInvoices, loadSettings]);

  // Product CRUD
  const addProduct = async (productData) => {
    try {
      const created = await productService.createProduct(productData);
      setProducts(prev => [created, ...prev]);
      showToast(`Product "${created.name}" registered successfully.`);
      return created;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create product.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updated = await productService.updateProduct(id, productData);
      setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
      showToast(`Product updated successfully.`);
      return updated;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update product.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(`Product removed from catalogue.`, 'info');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete product.';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Customer CRUD
  const addCustomer = async (custData) => {
    try {
      const created = await customerService.createCustomer(custData);
      setCustomers(prev => {
        const exists = prev.find(c => c.id === created.id);
        if (exists) return prev;
        return [created, ...prev];
      });
      showToast(`Customer "${created.name}" registered.`);
      return created;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to register customer.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateCustomer = async (id, custData) => {
    try {
      const updated = await customerService.updateCustomer(id, custData);
      setCustomers(prev => prev.map(c => (c.id === id ? updated : c)));
      showToast(`Customer details updated.`);
      return updated;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update customer.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await customerService.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast(`Customer deleted.`, 'info');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete customer.';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Settings
  const updateSettings = async (settingsData) => {
    try {
      await settingsService.updateSettings(settingsData);
      setSettings(settingsData);
      showToast('Store & Billing Settings saved.');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save settings.';
      showToast(msg, 'error');
    }
  };

  // Invoice Checkout
  const addInvoice = async (invoicePayload) => {
    try {
      const created = await invoiceService.checkout(invoicePayload);
      setInvoices(prev => [created, ...prev]);
      loadCustomers();
      return created;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invoice checkout failed.';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Reset Demo Data
  const resetDemoData = async () => {
    try {
      setIsLoadingData(true);
      await settingsService.resetDemoData();
      await Promise.all([loadProducts(), loadCustomers(), loadInvoices(), loadSettings()]);
      showToast('Store catalogue reset with sample textile products & data!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset demo data.';
      showToast(msg, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        customers,
        invoices,
        settings,
        isLoadingData,
        toastMessage,
        showToast,
        loadProducts,
        loadCustomers,
        loadInvoices,
        loadSettings,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateSettings,
        addInvoice,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppContext = useApp;
