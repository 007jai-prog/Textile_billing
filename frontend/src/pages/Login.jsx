import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const registeredNotice = location.state?.registered;
  const initialEmail = location.state?.email || '';

  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = request token, 2 = enter new password
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  // OAuth redirect state
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'microsoft' | null

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      identifier: initialEmail || 'admin@gmail.com',
      password: 'admin'
    }
  });

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      await login(data.identifier.trim(), data.password, rememberMe);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      setServerError(
        typeof detail === 'string'
          ? detail
          : 'Unable to sign in. Please verify your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setServerError('');
    setOauthLoading(provider);

    try {
      const redirectUri = window.location.origin + '/auth/callback';
      let data;
      if (provider === 'google') {
        data = await authService.getGoogleAuthUrl(redirectUri);
      } else {
        data = await authService.getMicrosoftAuthUrl(redirectUri);
      }

      if (data && data.url) {
        // Redirect browser directly to Google / Microsoft OAuth 2.0 authorization endpoint
        window.location.href = data.url;
      } else {
        setServerError('Unable to initiate OAuth authentication service.');
        setOauthLoading(null);
      }
    } catch (err) {
      console.error('OAuth error:', err);
      const detail = err.response?.data?.detail;
      setServerError(
        typeof detail === 'string'
          ? detail
          : `Failed to initiate ${provider} authentication. Check configuration.`
      );
      setOauthLoading(null);
    }
  };

  const handleRequestResetToken = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your account email.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMsg('');

    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setForgotMsg(res.message || 'Reset code generated.');
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Failed to request reset token.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword) {
      setForgotError('Please provide both the reset code and a new password.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await authService.resetPassword(resetToken.trim(), newPassword);
      setForgotMsg(res.message || 'Password reset successfully!');
      setTimeout(() => {
        setIsForgotOpen(false);
        setForgotStep(1);
        setForgotEmail('');
        setResetToken('');
        setNewPassword('');
      }, 1800);
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--theme-bg-main)', color: 'var(--theme-text-main)' }}
    >
      {/* Background Ambience */}
      <div
        className="pointer-events-none absolute -left-28 top-1/4 h-96 w-96 rounded-full blur-[130px] opacity-25"
        style={{ backgroundColor: 'var(--theme-primary)' }}
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-1/4 h-96 w-96 rounded-full blur-[130px] opacity-20"
        style={{ backgroundColor: 'var(--theme-accent)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Header Branding */}
        <header className="mb-6 text-center">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-text)'
              }}
            >
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div className="text-left">
              <span className="text-xl font-extrabold tracking-tight block leading-tight" style={{ color: 'var(--theme-text-main)' }}>
                Textile POS
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Retail & Billing ERP
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
            Sign in to your showroom
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Open counter billing, invoices register, and store metrics.
          </p>
        </header>

        {/* Main Card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border p-6 sm:p-8 shadow-xl backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)'
          }}
        >
          {registeredNotice && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">Store Registered Successfully</p>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                  Your store and account are saved. Sign in to enter your POS terminal.
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          

          

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Email address or Phone
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter e-mail or mobile number"
                  {...register('identifier', {
                    required: 'Please enter your email or phone number.'
                  })}
                  className="w-full rounded-xl border bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-hidden transition"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your showroom password"
                  {...register('password', {
                    required: 'Please enter your password.'
                  })}
                  className="w-full rounded-xl border bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-10 text-xs font-medium focus:outline-hidden transition"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Remember me on this terminal
                </span>
              </label>
            </div>

            {/* Sign In CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-text)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to POS</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Navigation to Sign Up */}
          
        </motion.section>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(false);
                  setForgotError('');
                  setForgotMsg('');
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--theme-primary-light)',
                    color: 'var(--theme-primary)'
                  }}
                >
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--theme-text-main)' }}>
                    Reset Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {forgotStep === 1 ? 'Step 1: Request Reset Code' : 'Step 2: Enter New Password'}
                  </p>
                </div>
              </div>

              {forgotError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotMsg && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestResetToken} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your e-mail"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-hidden"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary-text)'
                    }}
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Send Reset Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reset Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste reset code"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-medium focus:outline-hidden"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-hidden"
                        style={{ borderColor: 'var(--theme-border)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary-text)'
                    }}
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Save New Password</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Login;
