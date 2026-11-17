import { api } from './api';

export const customerService = {
  getCustomers: async (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await api.get(`/customers${params}`);
    return res.data;
  },

  createCustomer: async (customerData) => {
    const res = await api.post('/customers', customerData);
    return res.data;
  },

  updateCustomer: async (id, customerData) => {
    const res = await api.put(`/customers/${id}`, customerData);
    return res.data;
  },

  deleteCustomer: async (id) => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },

  getCustomerHistory: async (id) => {
    const res = await api.get(`/customers/${id}/history`);
    return res.data;
  }
};
