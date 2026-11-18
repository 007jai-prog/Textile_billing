import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ShoppingBag,
  Store,
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthSuccess } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [requiresStoreSetup, setRequiresStoreSetup] = useState(false);
  const [oauthProfile, setOauthProfile] = useState(null);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      store_name: '',
      phone: '',
      store_address: '',
      city: 'Salem',
      state: 'Tamil Nadu',
      gstin: ''
    }
  });

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state') || 'google';
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setErrorMsg(errorDescription || `Authentication error: ${error}`);
        setIsLoading(false);
        return;
      }

      if (!code) {
        setErrorMsg('No authorization code was received from the OAuth provider.');
        setIsLoading(false);
        return;
      }

      const redirectUri = window.location.origin + '/auth/callback';

      try {
        const data = await authService.handleOAuthCallback(state, code, redirectUri);

        if (data.requires_store_setup) {
          setRequiresStoreSetup(true);
          setOauthProfile(data.oauth_profile);
          setIsLoading(false);
        } else if (data.access_token) {
          handleOAuthSuccess(data);
          navigate('/dashboard', { replace: true });
        } else {
          setErrorMsg('Unexpected response from authentication server.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        const detail = err.response?.data?.detail;
        setErrorMsg(
          typeof detail === 'string'
            ? detail
            : 'Failed to complete OAuth authentication. Please try signing in again.'
        );
        setIsLoading(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, handleOAuthSuccess]);

  const onCompleteStoreSetup = async (formData) => {
    if (!oauthProfile) return;
    setIsSubmittingStore(true);
    setErrorMsg('');

    try {
      const payload = {
        email: oauthProfile.email,
        name: oauthProfile.name,
        provider: oauthProfile.provider,
        provider_id: oauthProfile.provider_id,
        store_name: formData.store_name.trim(),
        phone: formData.phone.trim(),
        store_address: formData.store_address.trim(),
        city: formData.city.trim() || 'Salem',
        state: formData.state.trim() || 'Tamil Nadu',
        gstin: formData.gstin.trim()
      };

      const res = await authService.completeOAuthStoreSetup(payload);
      handleOAuthSuccess(res);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Store setup error:', err);
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === 'string'
          ? detail
          : 'Unable to register your store. Please check the information and try again.'
      );
    } finally {
      setIsSubmittingStore(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--theme-bg-main)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6 sm:p-8 shadow-xl"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)'
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{
              backgroundColor: 'var(--theme-primary)',
              color: 'var(--theme-primary-text)'
            }}
          >
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
              Textile POS
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Enterprise Retail Billing</p>
          </div>
        </div>

        {/* 1. Loading State */}
        {isLoading && (
          <div className="text-center py-10 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: 'var(--theme-primary)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-main)' }}>
              Verifying OpenID Connect Credentials…
            </h2>
            <p className="text-xs text-slate-500">
              Exchanging authorization code and securely connecting your account.
            </p>
          </div>
        )}

        {/* 2. Error State */}
        {!isLoading && errorMsg && !requiresStoreSetup && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Authentication Failed</p>
                <p className="mt-1">{errorMsg}</p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-text)'
                }}
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 3. New User: Collect Missing Required Store Information */}
        {!isLoading && requiresStoreSetup && oauthProfile && (
          <div className="space-y-5">
            <div
              className="p-3.5 rounded-xl border flex items-center gap-3 text-xs"
              style={{
                backgroundColor: 'var(--theme-primary-light)',
                borderColor: 'var(--theme-primary-border)'
              }}
            >
              <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-primary)' }} />
              <div>
                <p className="font-bold" style={{ color: 'var(--theme-text-main)' }}>
                  Signed in via {oauthProfile.provider === 'google' ? 'Google' : 'Microsoft'}!
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Verified account: <span className="font-semibold">{oauthProfile.email}</span> ({oauthProfile.name})
                </p>
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                Complete Your Store Setup
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Enter your textile showroom details to finish setting up your POS terminal.
              </p>

              {errorMsg && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onCompleteStoreSetup)} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Store / Showroom Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Lady Avenue "
                      {...register('store_name', { required: 'Store name is required.' })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-hidden"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>
                  {errors.store_name && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.store_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Store Mobile / Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="e.g. 9840123456"
                      {...register('phone', {
                        required: 'Phone number is required.',
                        minLength: { value: 10, message: 'Minimum 10 digits.' }
                      })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-hidden"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Salem"
                      {...register('city')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-hidden"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="33AABCS8899K1ZM"
                      {...register('gstin')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-hidden uppercase"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingStore}
                    className="w-full py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary-text)'
                    }}
                  >
                    {isSubmittingStore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Store & Terminal…</span>
                      </>
                    ) : (
                      <>
                        <span>Finish Setup & Open Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
