import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../common/Toast';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Check, X, Sparkles } from 'lucide-react';

export const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { toastMessage } = useApp();
  const { activeTheme, isLivePreviewing, previewThemeId, saveTheme, revertPreview } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2: Go to POS
      if (e.key === 'F2') {
        e.preventDefault();
        if (location.pathname !== '/pos') {
          navigate('/pos');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname]);

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--theme-bg-main)',
        color: 'var(--theme-text-main)'
      }}
    >
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out pl-0 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Floating Live Preview Banner */}
      {isLivePreviewing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-indigo-500/40 backdrop-blur-md animate-bounce-once">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Previewing: <strong className="text-indigo-300">{activeTheme.name}</strong>
              {activeTheme.subtitle && ` (${activeTheme.subtitle})`}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
            <button
              type="button"
              onClick={() => saveTheme(previewThemeId, false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Save</span>
            </button>
            <button
              type="button"
              onClick={revertPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Alerts */}
      <Toast toast={toastMessage} />
    </div>
  );
};
