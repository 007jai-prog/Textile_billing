import { api } from './api';

export const festivalService = {
  getOffers: async (activeOnly = false) => {
    const res = await api.get(`/festival-offers?active_only=${activeOnly}`);
    return res.data;
  },

  createOffer: async (offerData) => {
    const res = await api.post('/festival-offers', offerData);
    return res.data;
  },

  updateOffer: async (id, offerData) => {
    const res = await api.put(`/festival-offers/${id}`, offerData);
    return res.data;
  },

  deleteOffer: async (id) => {
    const res = await api.delete(`/festival-offers/${id}`);
    return res.data;
  },

  checkActiveOffer: async (billAmount) => {
    const res = await api.get(`/festival-offers/active-check?bill_amount=${billAmount}`);
    return res.data;
  }
};
