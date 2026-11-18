import { api } from './api';

export const invoiceService = {
  checkout: async (invoicePayload) => {
    const res = await api.post('/invoices', invoicePayload);
    return res.data;
  },

  getInvoices: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.payment_method && filters.payment_method !== 'all') params.append('payment_method', filters.payment_method);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit);

    const res = await api.get(`/invoices?${params.toString()}`);
    return res.data;
  },

  getInvoiceById: async (id) => {
    const res = await api.get(`/invoices/${id}`);
    return res.data;
  }
};
