
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';

import { THEMES, getThemeById } from '../data/themes';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

const ThemeContext = createContext(null);

const THEME_STORAGE_PREFIX = 'texbill_user_theme_';
const THEME_STORAGE_KEY = 'texbill_app_theme';
const MODE_STORAGE_KEY = 'texbill_app_mode';

const DEFAULT_THEME_ID = 'default';
const DEFAULT_MODE = 'light';

// -----------------------------------------
// GET VALID THEME
// -----------------------------------------

const getValidTheme = (themeId) => {
  try {
    const theme = getThemeById(themeId);

    if (theme && theme.colors) {
      return theme;
    }
  } catch (error) {
    console.warn('Unable to load saved theme:', error);
  }

  return getThemeById(DEFAULT_THEME_ID);
};

// -----------------------------------------
// GET SAVED MODE
// Never read the device's system theme.
// -----------------------------------------

const getSavedMode = () => {
  try {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY);

    return savedMode === 'dark' ? 'dark' : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
};

// -----------------------------------------
// THEME PROVIDER
// -----------------------------------------

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();

  const {
    settings,
    updateSettings,
    showToast
  } = useApp();

  // -----------------------------------------
  // MODE
  // -----------------------------------------

  const [mode, setModeState] = useState(getSavedMode);

  // -----------------------------------------
  // CURRENT THEME
  // -----------------------------------------

  const [currentThemeId, setCurrentThemeId] = useState(() => {
    try {
      if (user?.id) {
        const savedUserTheme = localStorage.getItem(
          THEME_STORAGE_PREFIX + user.id
        );

        if (savedUserTheme) {
          return getValidTheme(savedUserTheme).id;
        }
      }

      const savedGlobalTheme = localStorage.getItem(THEME_STORAGE_KEY);

      return savedGlobalTheme
        ? getValidTheme(savedGlobalTheme).id
        : DEFAULT_THEME_ID;

    } catch {
      return DEFAULT_THEME_ID;
    }
  });

  // -----------------------------------------
  // PREVIEW THEME
  // -----------------------------------------

  const [previewThemeId, setPreviewThemeId] = useState(null);

  // -----------------------------------------
  // SYNC WITH BACKEND SETTINGS
  // Backend appearance settings take priority.
  // -----------------------------------------

  useEffect(() => {
    if (!settings?.appearance) return;

    const savedTheme = settings.appearance.theme;
    const savedMode = settings.appearance.mode;

    if (savedTheme) {
      const validTheme = getValidTheme(savedTheme);

      setCurrentThemeId(validTheme.id);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, validTheme.id);

        if (user?.id) {
          localStorage.setItem(
            THEME_STORAGE_PREFIX + user.id,
            validTheme.id
          );
        }
      } catch (error) {
        console.warn('Unable to save theme locally:', error);
      }
    }

    if (savedMode === 'light' || savedMode === 'dark') {
      setModeState(savedMode);

      try {
        localStorage.setItem(MODE_STORAGE_KEY, savedMode);
      } catch (error) {
        console.warn('Unable to save mode locally:', error);
      }
    }

  }, [
    settings?.appearance?.theme,
    settings?.appearance?.mode,
    user?.id
  ]);

  // -----------------------------------------
  // ACTIVE THEME
  // -----------------------------------------

  const effectiveThemeId = previewThemeId || currentThemeId;

  const activeTheme = useMemo(() => {
    return getValidTheme(effectiveThemeId);
  }, [effectiveThemeId]);

  const isLivePreviewing = Boolean(
    previewThemeId &&
    previewThemeId !== currentThemeId
  );

  // -----------------------------------------
  // APPLY SELECTED THEME TO WEBSITE
  // -----------------------------------------

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Use only the mode selected inside the POS application.
    // Never use window.matchMedia or prefers-color-scheme.

    const colorTokens =
      mode === 'dark' && activeTheme.dark
        ? activeTheme.dark
        : activeTheme.colors;

    // CSS theme variables

    const themeVariables = {
      '--theme-primary': colorTokens.primary,
      '--theme-primary-hover': colorTokens.primaryHover,
      '--theme-primary-light': colorTokens.primaryLight,
      '--theme-primary-border': colorTokens.primaryBorder,
      '--theme-primary-text': colorTokens.primaryText,

      '--theme-bg-main': colorTokens.bgMain,
      '--theme-bg-card': colorTokens.bgCard,
      '--theme-bg-sidebar': colorTokens.bgSidebar,

      '--theme-sidebar-text': colorTokens.sidebarText,
      '--theme-sidebar-active': colorTokens.sidebarActive,
      '--theme-sidebar-border':
        colorTokens.sidebarBorder || colorTokens.border,

      '--theme-border': colorTokens.border,

      '--theme-text-main': colorTokens.textMain,
      '--theme-text-muted': colorTokens.textMuted,

      '--theme-accent': colorTokens.accent
    };

    // Apply all theme variables

    Object.entries(themeVariables).forEach(([property, value]) => {
      if (value) {
        root.style.setProperty(property, value);
      }
    });

    // Set selected theme and mode

    root.setAttribute('data-theme', activeTheme.id);
    root.setAttribute('data-mode', mode);

    // Control native browser elements using app mode

    root.style.colorScheme = mode;

    // Apply body colours

    body.style.backgroundColor = colorTokens.bgMain;
    body.style.color = colorTokens.textMain;

    // Tailwind class-based dark mode

    root.classList.toggle('dark', mode === 'dark');

  }, [activeTheme, mode]);

  // -----------------------------------------
  // PREVIEW THEME
  // -----------------------------------------

  const previewTheme = useCallback((themeId) => {
    const theme = getValidTheme(themeId);

    setPreviewThemeId(theme.id);
  }, []);

  // -----------------------------------------
  // REVERT PREVIEW
  // -----------------------------------------

  const revertPreview = useCallback(() => {
    setPreviewThemeId(null);

    if (showToast) {
      showToast('Theme preview reverted.', 'info');
    }
  }, [showToast]);

  // -----------------------------------------
  // SAVE THEME
  // -----------------------------------------

  const saveTheme = useCallback(async (themeId, isGlobal = false) => {
    const theme = getValidTheme(themeId);

    setCurrentThemeId(theme.id);
    setPreviewThemeId(null);

    // Save locally

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);

      if (user?.id) {
        localStorage.setItem(
          THEME_STORAGE_PREFIX + user.id,
          theme.id
        );
      }
    } catch (error) {
      console.warn('Unable to save theme locally:', error);
    }

    // Save to backend settings

    if (updateSettings && settings) {
      try {
        await updateSettings({
          ...settings,
          appearance: {
            ...(settings.appearance || {}),
            theme: theme.id,
            mode
          }
        });
      } catch (error) {
        console.error('Failed to save theme settings:', error);

        if (showToast) {
          showToast(
            'Theme applied locally, but backend saving failed.',
            'error'
          );
        }

        return;
      }
    }

    if (showToast) {
      if (isGlobal) {
        showToast(
          `Showroom global default theme updated to "${theme.name}".`,
          'success'
        );
      } else {
        showToast(
          `Applied and saved "${theme.name}" theme!`,
          'success'
        );
      }
    }

  }, [
    user?.id,
    updateSettings,
    settings,
    mode,
    showToast
  ]);

  // -----------------------------------------
  // CHANGE LIGHT / DARK MODE
  // -----------------------------------------

  const setMode = useCallback(async (newMode) => {
    if (newMode !== 'light' && newMode !== 'dark') {
      return;
    }

    // Immediately update the application appearance

    setModeState(newMode);

    // Save locally

    try {
      localStorage.setItem(MODE_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Unable to save mode locally:', error);
    }

    // Persist selected mode in backend settings

    if (updateSettings && settings) {
      try {
        await updateSettings({
          ...settings,
          appearance: {
            ...(settings.appearance || {}),
            theme: currentThemeId,
            mode: newMode
          }
        });
      } catch (error) {
        console.error('Failed to save appearance mode:', error);

        if (showToast) {
          showToast(
            'Mode changed locally, but backend saving failed.',
            'error'
          );
        }
      }
    }

  }, [
    updateSettings,
    settings,
    currentThemeId,
    showToast
  ]);

  // -----------------------------------------
  // TOGGLE MODE
  // -----------------------------------------

  const toggleMode = useCallback(() => {
    const nextMode = mode === 'light' ? 'dark' : 'light';

    setMode(nextMode);
  }, [mode, setMode]);

  // -----------------------------------------
  // CONTEXT VALUE
  // -----------------------------------------

  const contextValue = useMemo(() => ({
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
    saveTheme

  }), [
    currentThemeId,
    previewThemeId,
    activeTheme,
    isLivePreviewing,
    mode,
    setMode,
    toggleMode,
    previewTheme,
    revertPreview,
    saveTheme
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// -----------------------------------------
// CUSTOM THEME HOOK
// -----------------------------------------

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider'
    );
  }

  return context;
};
