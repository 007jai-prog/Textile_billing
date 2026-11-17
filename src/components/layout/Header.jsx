import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Menu,
  Clock,
  PlusCircle,
  Building2,
  User,
  ShieldCheck,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Header = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useApp();
  const { user, logout } = useAuth();
  const { activeTheme, mode, toggleMode } = useTheme();
  const [currentTime, setCurrentTime] = useState(dayjs().format('DD MMM YYYY, hh:mm:ss A'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('DD MMM YYYY, hh:mm:ss A'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Store Performance Dashboard';
      case '/pos':
        return 'Point of Sale (POS) Billing';
      case '/invoices':
        return 'Invoices & Tax Receipts';
      case '/products':
        return 'Textile Products Catalogue';
      case '/customers':
        return 'Customer Directory & Loyalty';
      case '/coupons':
        return 'Coupons & Festival Campaigns';
      case '/reports':
        return 'Sales, GST & Saree Analytics';
      case '/settings':
        return 'Store & Appearance Settings';
      default:
        return 'ChennaSilks POS';
    }
  };

  return (
    <header
      className="sticky top-0 z-30 h-16 backdrop-blur-md border-b px-3 sm:px-4 lg:px-6 flex items-center justify-between transition-colors duration-200"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text-main)'
      }}
    >
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setIsMobileOpen?.(!isMobileOpen)}
          className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors lg:hidden shrink-0"
          aria-label="Toggle navigation drawer"
          title="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 truncate">
          <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">{getPageTitle()}</h2>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs opacity-75 truncate">
            <span
              className="flex items-center gap-1 font-semibold truncate"
              style={{ color: 'var(--theme-primary)' }}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user?.store_name || settings?.store?.storeName || 'ChennaSilks Showroom'}</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline truncate">GSTIN: {settings?.store?.gstin || '33AABCS8899K1ZM'}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Theme Mode, Clock */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Clock */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-main)'
          }}
        >
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
          <span>{currentTime}</span>
        </div>

        {/* Theme Picker / Appearance Shortcut */}
        <button
          type="button"
          onClick={() => navigate('/settings', { state: { tab: 'appearance' } })}
          className="p-2 rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/10 relative group"
          style={{ borderColor: 'var(--theme-border)' }}
          title={`Active Theme: ${activeTheme.name}. Click to change theme.`}
        >
          <Palette className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
          <span
            className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 shadow-xs"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          />
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleMode}
          className="p-2 rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ borderColor: 'var(--theme-border)' }}
          title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {mode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Quick New Bill CTA */}
        {location.pathname !== '/pos' && (
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Bill</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-black/20 rounded text-[10px]">F2</kbd>
          </button>
        )}

        {/* Cashier profile */}
        <div
          className="flex items-center gap-2 pl-2.5 border-l"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div
            className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-main)',
              color: 'var(--theme-primary)'
            }}
          >
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold leading-tight">
              {user?.name?.split(' ')[0] || settings?.billing?.cashierName?.split(' ')[0] || 'Cashier'}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> Online
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
