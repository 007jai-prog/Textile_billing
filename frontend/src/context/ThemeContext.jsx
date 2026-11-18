import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { THEMES, getThemeById } from '../data/themes';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

const ThemeContext = createContext();

const THEME_STORAGE_PREFIX = 'texbill_user_theme_';

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const { settings, updateSettings, showToast } = useApp();

  // Mode: 'light' or 'dark'
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('texbill_app_mode') || 'light';
  });

  // Current saved theme ID
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    // 1. User specific preference
    const savedUserTheme = user?.id ? localStorage.getItem(THEME_STORAGE_PREFIX + user.id) : null;
    if (savedUserTheme) return savedUserTheme;

    // 2. Global fallback from localStorage
    const savedGlobal = localStorage.getItem('texbill_app_theme');
    if (savedGlobal) return savedGlobal;

    return 'default';
  });

  // Preview theme ID (null when not previewing)
  const [previewThemeId, setPreviewThemeId] = useState(null);

  // Sync with user change or store settings from backend
  useEffect(() => {
    if (user?.id) {
      const userTheme = localStorage.getItem(THEME_STORAGE_PREFIX + user.id);
      if (userTheme) {
        setCurrentThemeId(userTheme);
        return;
      }
    }

    if (settings?.appearance?.theme) {
      setCurrentThemeId(settings.appearance.theme);
    }
  }, [user?.id, settings?.appearance?.theme]);

  // Active theme calculation
  const effectiveThemeId = previewThemeId || currentThemeId;
  const activeTheme = useMemo(() => getThemeById(effectiveThemeId), [effectiveThemeId]);
  const isLivePreviewing = Boolean(previewThemeId && previewThemeId !== currentThemeId);

  // Inject CSS Variables on DOM whenever activeTheme or mode changes
  useEffect(() => {
    const root = document.documentElement;
    const colorTokens = mode === 'dark' && activeTheme.dark ? activeTheme.dark : activeTheme.colors;

    // Set CSS custom properties
    root.style.setProperty('--theme-primary', colorTokens.primary);
    root.style.setProperty('--theme-primary-hover', colorTokens.primaryHover);
    root.style.setProperty('--theme-primary-light', colorTokens.primaryLight);
    root.style.setProperty('--theme-primary-border', colorTokens.primaryBorder);
    root.style.setProperty('--theme-primary-text', colorTokens.primaryText);
    root.style.setProperty('--theme-bg-main', colorTokens.bgMain);
    root.style.setProperty('--theme-bg-card', colorTokens.bgCard);
    root.style.setProperty('--theme-bg-sidebar', colorTokens.bgSidebar);
    root.style.setProperty('--theme-sidebar-text', colorTokens.sidebarText);
    root.style.setProperty('--theme-sidebar-active', colorTokens.sidebarActive);
    root.style.setProperty('--theme-sidebar-border', colorTokens.sidebarBorder || colorTokens.border);
    root.style.setProperty('--theme-border', colorTokens.border);
    root.style.setProperty('--theme-text-main', colorTokens.textMain);
    root.style.setProperty('--theme-text-muted', colorTokens.textMuted);
    root.style.setProperty('--theme-accent', colorTokens.accent);

    // Set DOM attributes
    root.setAttribute('data-theme', activeTheme.id);
    root.setAttribute('data-mode', mode);

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [activeTheme, mode]);

  // Set preview theme
  const previewTheme = useCallback((themeId) => {
    setPreviewThemeId(themeId);
  }, []);

  // Revert preview
  const revertPreview = useCallback(() => {
    setPreviewThemeId(null);
    if (showToast) {
      showToast('Theme preview reverted.', 'info');
    }
  }, [showToast]);

  // Save theme permanently
  const saveTheme = useCallback(async (themeId, isGlobal = false) => {
    setCurrentThemeId(themeId);
    setPreviewThemeId(null);

    // Save in user-specific localStorage
    if (user?.id) {
      localStorage.setItem(THEME_STORAGE_PREFIX + user.id, themeId);
    }
    localStorage.setItem('texbill_app_theme', themeId);

    // If admin requested global default, persist in backend store settings
    if (isGlobal && updateSettings && settings) {
      try {
        await updateSettings({
          ...settings,
          appearance: {
            ...(settings.appearance || {}),
            theme: themeId,
            mode: mode
          }
        });
        if (showToast) {
          showToast(`Showroom global default theme updated to "${getThemeById(themeId).name}".`, 'success');
        }
        return;
      } catch (e) {
        console.error('Failed to update global theme in settings:', e);
      }
    }

    if (showToast) {
      showToast(`Applied and saved "${getThemeById(themeId).name}" theme!`, 'success');
    }
  }, [user?.id, updateSettings, settings, mode, showToast]);

  // Toggle Mode (light / dark)
  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('texbill_app_mode', next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themes: THEMES,
        currentThemeId,
        previewThemeId,
        activeTheme,
        isLivePreviewing,
        mode,
        setMode,
        toggleMode,
        previewTheme,
        revertPreview,
        saveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
