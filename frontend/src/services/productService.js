import { api } from './api';
import { mockProducts } from '../data/mockProducts';

const STORAGE_KEY = 'texbill_products';

const getStoredProducts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached products from localStorage:', e);
  }
  const initial = Array.isArray(mockProducts) ? [...mockProducts] : [];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {
    // ignore
  }
  return initial;
};

const persistStoredProducts = (products) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('Failed to save products to localStorage:', e);
  }
};

const filterProductsList = (list, filters = {}) => {
  return list.filter((p) => {
    if (filters.category && filters.category !== 'All' && p.category !== filters.category) {
      return false;
    }
    if (filters.fabric && filters.fabric !== 'All' && p.fabric !== filters.fabric) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchesName = (p.name || '').toLowerCase().includes(q);
      const matchesBrand = (p.brand || '').toLowerCase().includes(q);
      const matchesVariants = (p.variants || []).some((v) =>
        (v.sku && v.sku.toLowerCase().includes(q)) || (v.barcode && v.barcode.includes(q))
      );
      if (!matchesName && !matchesBrand && !matchesVariants) {
        return false;
      }
    }
    return true;
  });
};

export const productService = {
  getLocalProducts: () => {
    return getStoredProducts();
  },

  getProducts: async (filters = {}) => {
    const local = getStoredProducts();

    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.fabric && filters.fabric !== 'All') params.append('fabric', filters.fabric);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/products?${params.toString()}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const backendMap = new Map(res.data.map((p) => [p.id, p]));
        const merged = [...res.data];
        for (const localItem of local) {
          if (!backendMap.has(localItem.id)) {
            merged.push(localItem);
          }
        }
        persistStoredProducts(merged);
        return filterProductsList(merged, filters);
      }
      return filterProductsList(local, filters);
    } catch (err) {
      console.warn('Backend /products failed, falling back to local cache:', err.message || err);
      return filterProductsList(local, filters);
    }
  },

  getProductById: async (id) => {
    try {
      const res = await api.get(`/products/${id}`);
      return res.data;
    } catch (err) {
      const local = getStoredProducts();
      const found = local.find((p) => p.id === id);
      if (found) return found;
      throw err;
    }
  },

  createProduct: async (productData) => {
    const local = getStoredProducts();
    const newId = productData.id || `prod-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`;
    const nowIso = new Date().toISOString();

    const variants = (productData.variants || []).map((v, idx) => ({
      ...v,
      id: v.id || `v-${Date.now()}-${idx + 1}`,
      sku: (v.sku || '').trim() || `TX-${Date.now().toString().slice(-6)}-${idx + 1}`,
      price: Number(v.price) || Number(productData.price) || 0,
      mrp: Number(v.mrp) || Number(productData.mrp) || 0,
    }));

    const newProduct = {
      ...productData,
      id: newId,
      name: (productData.name || '').trim(),
      price: Number(productData.price) || 0,
      mrp: Number(productData.mrp) || 0,
      gstRate: Number(productData.gstRate) || 5,
      variants: variants.length > 0 ? variants : [
        {
          id: `v-${Date.now()}-1`,
          size: 'Free Size',
          color: 'Standard',
          hex: '#6366f1',
          sku: `TX-${Date.now().toString().slice(-6)}-FS`,
          barcode: '',
          price: Number(productData.price) || 0,
          mrp: Number(productData.mrp) || 0,
        }
      ],
      created_at: nowIso,
      updated_at: nowIso,
    };

    const updatedList = [newProduct, ...local.filter((p) => p.id !== newId)];
    persistStoredProducts(updatedList);

    try {
      const res = await api.post('/products', productData);
      if (res.data && res.data.id) {
        const backendSaved = { ...newProduct, ...res.data };
        const syncedList = [backendSaved, ...local.filter((p) => p.id !== newId && p.id !== backendSaved.id)];
        persistStoredProducts(syncedList);
        return backendSaved;
      }
      return newProduct;
    } catch (err) {
      console.warn('Backend product creation warning, stored in-memory successfully:', err.response?.data?.detail || err.message);
      return newProduct;
    }
  },

  updateProduct: async (id, productData) => {
    const local = getStoredProducts();
    const nowIso = new Date().toISOString();

    const updatedProduct = {
      ...local.find((p) => p.id === id),
      ...productData,
      id,
      updated_at: nowIso,
    };

    const updatedList = local.map((p) => (p.id === id ? updatedProduct : p));
    persistStoredProducts(updatedList);

    try {
      const res = await api.put(`/products/${id}`, productData);
      if (res.data) {
        const finalObj = { ...updatedProduct, ...res.data };
        persistStoredProducts(local.map((p) => (p.id === id ? finalObj : p)));
        return finalObj;
      }
      return updatedProduct;
    } catch (err) {
      console.warn('Backend product update warning, updated in-memory successfully:', err.response?.data?.detail || err.message);
      return updatedProduct;
    }
  },

  deleteProduct: async (id) => {
    const local = getStoredProducts();
    const filtered = local.filter((p) => p.id !== id);
    persistStoredProducts(filtered);

    try {
      await api.delete(`/products/${id}`);
    } catch (err) {
      console.warn('Backend product delete warning, removed in-memory successfully:', err.message);
    }
    return true;
  },
};
