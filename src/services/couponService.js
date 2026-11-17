import { api } from './api';

const getErrorMessage = (data) => {
  if (!data) return '';

  const message = data.detail ?? data.message ?? data.error;

  if (Array.isArray(message)) {
    return message
      .map((item) => item?.msg || item?.message || String(item))
      .join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return '';
};

export const couponService = {
  getCoupons: async (activeOnly = false) => {
    const res = await api.get(
      `/coupons?active_only=${encodeURIComponent(String(activeOnly))}`,
    );
    return res.data;
  },

  createCoupon: async (couponData) => {
    const res = await api.post('/coupons', couponData);
    return res.data;
  },

  updateCoupon: async (id, couponData) => {
    const res = await api.put(`/coupons/${encodeURIComponent(id)}`, couponData);
    return res.data;
  },

  deleteCoupon: async (id) => {
    const res = await api.delete(`/coupons/${encodeURIComponent(id)}`);
    return res.data;
  },

  validateCoupon: async (
    code,
    cartTotal,
    customerId = null,
    categories = [],
  ) => {
    const normalizedCode = String(code || '').trim().toUpperCase();
    const total = Number(cartTotal);

    if (!normalizedCode) {
      throw new Error('Enter a coupon code.');
    }

    if (!Number.isFinite(total) || total < 0) {
      throw new Error('The cart total is invalid.');
    }

    try {
      const res = await api.post('/coupons/validate', {
        code: normalizedCode,
        cart_total: total,
        customer_id: customerId || null,
        categories: Array.isArray(categories) ? categories : [],
      });

      return res.data;
    } catch (error) {
      const serverMessage = getErrorMessage(error?.response?.data);

      if (serverMessage) {
        throw new Error(serverMessage);
      }

      if (error?.response) {
        throw new Error(
          `Coupon validation failed (HTTP ${error.response.status}).`,
        );
      }

      if (error?.request) {
        throw new Error(
          'Could not reach the server to validate the coupon. Check your connection and try again.',
        );
      }

      throw new Error(error?.message || 'Could not validate the coupon.');
    }
  },

  getRedemptions: async () => {
    const res = await api.get('/coupons/redemptions');
    return res.data;
  },
};