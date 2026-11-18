import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Shirt,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Percent,
  Sparkles,
  LogOut,
  User,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { settings } = useApp();
  const { user, logout } = useAuth();
  const { activeTheme } = useTheme();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Bill / POS', href: '/pos', icon: ShoppingCart, highlight: true },
    { name: 'All Invoices', href: '/invoices', icon: Receipt },
    { name: 'Products', href: '/products', icon: Shirt },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Coupons & Offers', href: '/coupons', icon: Percent },
    { name: 'Sales Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    setIsMobileOpen?.(false);
    if (window.confirm('Are you sure you want to log out of this POS terminal?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r transition-all duration-300 ease-in-out w-72 max-w-[85vw] ${
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      style={{
        backgroundColor: 'var(--theme-bg-sidebar)',
        borderColor: 'var(--theme-sidebar-border)',
        color: 'var(--theme-sidebar-text)'
      }}
    >
      {/* Brand Header */}
      <div
        className={`flex h-16 shrink-0 items-center border-b px-4 justify-between lg:${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
        style={{ borderColor: 'var(--theme-sidebar-border)' }}
      >
        {/* Brand Logo & Name (visible when not collapsed on desktop, or always on mobile drawer) */}
        <div className={`flex min-w-0 items-center gap-3 overflow-hidden ${isCollapsed ? 'lg:hidden' : 'flex'}`}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--theme-primary), var(--theme-accent, #6366f1))`
            }}
          >
            <Store className="h-5 w-5" />
          </div>

          <div className="min-w-0 truncate">
            <h1 className="truncate text-sm font-bold tracking-wide text-white">
              {user?.store_name || settings?.store?.storeName || 'Lady Avenue POS'}
            </h1>
            <p className="flex items-center gap-1 truncate text-[11px] opacity-75">
              <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
              Textile Retail POS
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen?.(false)}
          className="lg:hidden shrink-0 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-white/10"
          title="Close menu"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Collapse / Expand Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex shrink-0 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-white/10"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileOpen?.(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  isCollapsed ? 'lg:justify-center lg:px-0' : ''
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor: 'var(--theme-sidebar-active)',
                      color: '#ffffff',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  : {
                      color: 'var(--theme-sidebar-text)',
                      opacity: 0.85
                    }
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />

              <span className={`flex-1 truncate ${isCollapsed ? 'lg:hidden' : 'inline'}`}>
                {item.name}
              </span>

              {item.highlight && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs ${
                    isCollapsed ? 'lg:hidden' : 'inline-block'
                  }`}
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  F2
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Cashier Profile & Sign Out Footer */}
      <div
        className="shrink-0 space-y-2 border-t p-3"
        style={{ borderColor: 'var(--theme-sidebar-border)' }}
      >
        <div
          className={`rounded-lg border px-3 py-2 text-xs items-center gap-2.5 ${
            isCollapsed ? 'hidden lg:hidden' : 'flex'
          }`}
          style={{
            borderColor: 'var(--theme-sidebar-border)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)'
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 text-white"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 truncate">
            <p className="truncate font-semibold text-white">
              {user?.name || settings?.billing?.cashierName || 'Cashier Terminal'}
            </p>
            <p className="truncate text-[10px] opacity-70">
              {user?.email || 'Logged in'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 transition-colors hover:bg-rose-950/40 hover:text-rose-300 ${
            isCollapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
          title="Sign out of POS"
        >
          <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
          <span className={isCollapsed ? 'lg:hidden' : 'inline'}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};