import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Store,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authService } from '../services/authService';

const GoogleIcon = () => (
  <svg
    className="h-4 w-4 shrink-0"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg
    className="h-4 w-4 shrink-0"
    viewBox="0 0 23 23"
    aria-hidden="true"
  >
    <rect fill="#F25022" x="1" y="1" width="10" height="10" />
    <rect fill="#7FBA00" x="12" y="1" width="10" height="10" />
    <rect fill="#00A4EF" x="1" y="12" width="10" height="10" />
    <rect fill="#FFB900" x="12" y="12" width="10" height="10" />
  </svg>
);

const PINCODE_PATTERN = /^[1-9]\d{5}$/;

const Register = () => {
  const navigate = useNavigate();

  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [pincodeStatus, setPincodeStatus] = useState('idle');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      store_name: '',
      owner_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      store_address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
    },
  });

  const passwordValue = watch('password');
  const pincodeValue = watch('pincode');

  // Look up the PIN code after the user enters six digits. The API can return
  // several post offices for a PIN; this uses the first result's district/state.
  useEffect(() => {
    const pincode = String(pincodeValue || '').trim();

    if (!pincode) {
      setPincodeStatus('idle');
      setValue('city', '');
      setValue('state', '');
      return undefined;
    }

    if (!PINCODE_PATTERN.test(pincode)) {
      setPincodeStatus('idle');
      setValue('city', '');
      setValue('state', '');
      return undefined;
    }

    const controller = new AbortController();

    setPincodeStatus('loading');
    setValue('city', '');
    setValue('state', '');
    clearErrors('pincode');

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error('PIN code lookup service is unavailable.');
        }

        const result = await response.json();
        const postOffices = result?.[0]?.PostOffice;

        if (
          result?.[0]?.Status !== 'Success' ||
          !Array.isArray(postOffices) ||
          postOffices.length === 0
        ) {
          setPincodeStatus('not-found');
          setError('pincode', {
            type: 'manual',
            message: 'No matching Indian PIN code was found.',
          });
          return;
        }

        const postOffice = postOffices[0];
        const city = postOffice.District || postOffice.Block || '';
        const state = postOffice.State || '';

        if (!city || !state) {
          setPincodeStatus('not-found');
          setError('pincode', {
            type: 'manual',
            message: 'Could not determine the city and state for this PIN code.',
          });
          return;
        }

        setValue('city', city, { shouldValidate: true });
        setValue('state', state, { shouldValidate: true });
        clearErrors('pincode');
        setPincodeStatus('success');
      } catch (error) {
        if (error.name === 'AbortError') return;

        setPincodeStatus('error');
        setError('pincode', {
          type: 'manual',
          message:
            'Could not look up this PIN code. Check your connection and try again.',
        });
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [pincodeValue, setValue, setError, clearErrors]);

  const onSubmit = async (data) => {
    setServerError('');

    if (pincodeStatus !== 'success' || !data.city || !data.state) {
      setError('pincode', {
        type: 'manual',
        message: 'Enter a valid PIN code and wait for the city and state lookup.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.register({
        store_name: data.store_name.trim(),
        owner_name: data.owner_name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        store_address: data.store_address.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        pincode: data.pincode.trim(),
        gstin: data.gstin.trim().toUpperCase(),
      });

      navigate('/login', {
        state: {
          registered: true,
          email: data.email.trim(),
        },
      });
    } catch (error) {
      console.error('Registration error:', error);

      const detail = error.response?.data?.detail;
      setServerError(
        typeof detail === 'string'
          ? detail
          : 'Failed to create your store account. Please check the details and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthRegister = async (provider) => {
    setServerError('');
    setOauthLoading(provider);

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const data =
        provider === 'google'
          ? await authService.getGoogleAuthUrl(redirectUri)
          : await authService.getMicrosoftAuthUrl(redirectUri);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setServerError('Unable to initiate OAuth registration.');
        setOauthLoading(null);
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setServerError(
        error.response?.data?.detail ||
          `Failed to initiate ${provider} registration.`,
      );
      setOauthLoading(null);
    }
  };

  const pincodeRegistration = register('pincode', {
    required: 'PIN code is required.',
    pattern: {
      value: PINCODE_PATTERN,
      message: 'Enter a valid 6-digit Indian PIN code.',
    },
    validate: () =>
      pincodeStatus === 'success' ||
      'Enter a valid PIN code and wait for the city and state lookup.',
  });

  return (
    <main
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8"
      style={{
        backgroundColor: 'var(--theme-bg-main)',
        color: 'var(--theme-text-main)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-1/4 h-96 w-96 rounded-full blur-[130px] opacity-25"
        style={{ backgroundColor: 'var(--theme-primary)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-1/4 h-96 w-96 rounded-full blur-[130px] opacity-20"
        style={{ backgroundColor: 'var(--theme-accent)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <header className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2.5">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-text)',
              }}
            >
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div className="text-left">
              <span
                className="block text-xl font-extrabold leading-tight tracking-tight"
                style={{ color: 'var(--theme-text-main)' }}
              >
                Textile POS
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Store Registration
              </span>
            </div>
          </div>

          <h1
            className="text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: 'var(--theme-text-main)' }}
          >
            Register Your Textile Showroom
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Create your store profile, POS register, and manager credentials.
          </p>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border p-6 shadow-xl backdrop-blur-sm sm:p-8"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          {serverError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="mb-6 space-y-2.5">
            <button
              type="button"
              disabled={oauthLoading !== null}
              onClick={() => handleOAuthRegister('google')}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-main)',
              }}
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <GoogleIcon />
              )}
              <span>Sign up with Google</span>
            </button>

            <button
              type="button"
              disabled={oauthLoading !== null}
              onClick={() => handleOAuthRegister('microsoft')}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-main)',
              }}
            >
              {oauthLoading === 'microsoft' ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <MicrosoftIcon />
              )}
              <span>Sign up with Microsoft</span>
            </button>
          </div>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full border-t"
                style={{ borderColor: 'var(--theme-border)' }}
              />
            </div>
            <span
              className="relative px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"
              style={{ backgroundColor: 'var(--theme-bg-card)' }}
            >
              or register with details
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Showroom Name *
                </label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="organization"
                    placeholder="Enter shop name"
                    {...register('store_name', {
                      required: 'Store name is required.',
                    })}
                    className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                </div>
                {errors.store_name && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {errors.store_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Owner Full Name *
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Ramesh Kumar"
                    {...register('owner_name', {
                      required: 'Owner name is required.',
                    })}
                    className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                </div>
                {errors.owner_name && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {errors.owner_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="owner@example.com"
                    {...register('email', {
                      required: 'Email is required.',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address.',
                      },
                    })}
                    className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile / Phone *
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="9840123456"
                    {...register('phone', {
                      required: 'Mobile number is required.',
                      minLength: {
                        value: 10,
                        message: 'Enter at least 10 characters.',
                      },
                      maxLength: {
                        value: 15,
                        message: 'Phone number cannot exceed 15 characters.',
                      },
                    })}
                    className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    {...register('password', {
                      required: 'Password is required.',
                      minLength: {
                        value: 6,
                        message: 'Minimum 6 characters.',
                      },
                    })}
                    className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-2.5 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    {...register('confirm_password', {
                      required: 'Please confirm your password.',
                      validate: (value) =>
                        value === passwordValue || 'Passwords do not match.',
                    })}
                    className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    className="absolute right-3 top-2.5 text-slate-400 transition hover:text-slate-600"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirmation password'
                        : 'Show confirmation password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Showroom Address
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoComplete="street-address"
                  placeholder="Street address (optional)"
                  {...register('store_address')}
                  className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  PIN Code *
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    placeholder="6-digit PIN"
                    {...pincodeRegistration}
                    onChange={(event) => {
                      const digitsOnly = event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6);

                      setValue('pincode', digitsOnly, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                    style={{ borderColor: 'var(--theme-border)' }}
                    aria-describedby="pincode-status"
                  />
                </div>
                {errors.pincode && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {errors.pincode.message}
                  </p>
                )}
                <p
                  id="pincode-status"
                  className="mt-1 text-[10px] text-slate-500"
                  aria-live="polite"
                >
                  {pincodeStatus === 'loading' && 'Looking up PIN code…'}
                  {pincodeStatus === 'success' && 'City and state matched.'}
                  {pincodeStatus === 'error' &&
                    'PIN lookup failed. Check your connection.'}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  City
                </label>
                <div className="relative">
                  <Building className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    {...register('city', {
                      required: 'City is filled from the PIN code lookup.',
                    })}
                    placeholder="Filled from PIN code"
                    className="w-full rounded-xl border bg-slate-100 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-700 focus:outline-none dark:bg-slate-800 dark:text-slate-200"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  State
                </label>
                <div className="relative">
                  <Building className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    {...register('state', {
                      required: 'State is filled from the PIN code lookup.',
                    })}
                    placeholder="Filled from PIN code"
                    className="w-full rounded-xl border bg-slate-100 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-700 focus:outline-none dark:bg-slate-800 dark:text-slate-200"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="33AABCS8899K1ZM"
                {...register('gstin')}
                className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-xs font-medium uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                style={{ borderColor: 'var(--theme-border)' }}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || pincodeStatus === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-text)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering your store…</span>
                  </>
                ) : (
                  <>
                    <span>Create Store Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-bold underline underline-offset-2 transition hover:opacity-80"
              style={{ color: 'var(--theme-primary)' }}
            >
              Sign in
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default Register;