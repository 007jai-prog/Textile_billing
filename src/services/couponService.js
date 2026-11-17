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

const normalizeCode = (value) => String(value ?? '').trim().toUpperCase();

const isCouponObject = (value) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  typeof value.code === 'string';

const findCouponInResponse = (data) => {
  const candidates = [
    data?.coupon,
    data?.applied_coupon,
    data?.data?.coupon,
    data?.data?.applied_coupon,
    data?.result?.coupon,
    data?.result?.applied_coupon,
  ];

  return candidates.find(isCouponObject) || null;
};

const getDiscountAmount = (data) => {
  const amount =
    data?.discount_amount ??
    data?.discountAmount ??
    data?.discount ??
    data?.data?.discount_amount ??
    data?.data?.discountAmount ??
    data?.result?.discount_amount;

  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCoupons = async (activeOnly = false) => {
  const response = await api.get('/coupons', {
    params: { active_only: activeOnly },
  });

  return Array.isArray(response.data) ? response.data : [];
};

export const couponService = {
  getCoupons,

  createCoupon: async (couponData) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },

  updateCoupon: async (id, couponData) => {
    const response = await api.put(
      `/coupons/${encodeURIComponent(id)}`,
      couponData,
    );
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${encodeURIComponent(id)}`);
    return response.data;
  },

  validateCoupon: async (
    code,
    cartTotal,
    customerId = null,
    categories = [],
  ) => {
    const normalizedCode = normalizeCode(code);
    const total = Number(cartTotal);

    if (!normalizedCode) {
      throw new Error('Enter a coupon code.');
    }

    if (!Number.isFinite(total) || total < 0) {
      throw new Error('The cart total is invalid.');
    }

    try {
      const response = await api.post('/coupons/validate', {
        code: normalizedCode,
        cart_total: total,
        customer_id: customerId || null,
        categories: Array.isArray(categories) ? categories : [],
      });

      const data = response.data;

      // Preserve a server-side rejection and its useful message.
      if (
        data?.valid === false ||
        data?.success === false ||
        data?.is_valid === false
      ) {
        return {
          ...data,
          valid: false,
          message:
            getErrorMessage(data) ||
            data?.message ||
            'This coupon is invalid or does not apply to this bill.',
        };
      }

      const isValid =
        data?.valid === true ||
        data?.success === true ||
        data?.is_valid === true;

      if (!isValid) {
        return data;
      }

      let coupon = findCouponInResponse(data);

      // Compatibility fallback: some validation endpoints return valid=true
      // but omit coupon details. Fetch this store's coupons and match exactly.
      if (!coupon) {
        const coupons = await getCoupons(false);
        coupon =
          coupons.find(
            (item) => normalizeCode(item?.code) === normalizedCode,
          ) || null;
      }

      if (!coupon) {
        throw new Error(
          'The server validated this coupon, but its details were not returned and the coupon could not be found in your store. Check the backend coupon validation response.',
        );
      }

      const discountAmount = getDiscountAmount(data);

      return {
        ...data,
        valid: true,
        coupon: {
          ...coupon,
          code: normalizeCode(coupon.code),
          min_bill_amount:
            coupon.min_bill_amount ?? coupon.min_purchase ?? 0,
          max_discount_amount:
            coupon.max_discount_amount ?? coupon.max_discount ?? 0,
        },
        discount_amount: discountAmount,
      };
    } catch (error) {
      // Preserve clear client-side errors and errors already normalized here.
      if (
        error instanceof Error &&
        !error.response &&
        !error.request &&
        error.message
      ) {
        throw error;
      }

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
    const response = await api.get('/coupons/redemptions');
    return response.data;
  },
};