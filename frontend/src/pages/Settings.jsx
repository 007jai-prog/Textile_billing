import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Store,
  Receipt,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building,
  Printer,
  Palette,
  Eye,
  Check,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  User,
  Crown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { THEME_CATEGORIES } from '../data/themes';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import Badge from '../components/common/Badge';

export const Settings = () => {
  const location = useLocation();
  const { settings, updateSettings, resetDemoData } = useApp();
  const {
    themes,
    currentThemeId,
    previewThemeId,
    activeTheme,
    isLivePreviewing,
    mode,
    toggleMode,
    previewTheme,
    revertPreview,
    saveTheme
  } = useTheme();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'appearance');
  const [selectedThemeCategory, setSelectedThemeCategory] = useState('all');
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [formData, setFormData] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  if (!formData) return null;

  const handleStoreChange = (field, value) => {
    setFormData({
      ...formData,
      store: {
        ...formData.store,
        [field]: value,
      }
    });
  };

  const handleBillingChange = (field, value) => {
    setFormData({
      ...formData,
      billing: {
        ...formData.billing,
        [field]: value,
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
  };

  // Filtered themes
  const filteredThemes = themes.filter(t => {
    const matchesCat = selectedThemeCategory === 'all' || t.category === selectedThemeCategory;
    const q = themeSearchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesName = t.name.toLowerCase().includes(q);
    const matchesSub = (t.subtitle || '').toLowerCase().includes(q);
    const matchesDesc = t.description.toLowerCase().includes(q);
    return matchesCat && (matchesName || matchesSub || matchesDesc);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-xs transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-main)'
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Showroom & POS Settings</h1>
            <Badge variant="primary" size="sm">
              <Crown className="w-3 h-3 mr-1 inline text-amber-500" />
              Enterprise Plan
            </Badge>
          </div>
          <p className="text-xs opacity-75 mt-0.5">
            Configure store profile, 21+ aesthetic themes, invoice formatting, and cash drawer settings
          </p>
        </div>

        {activeTab !== 'appearance' && (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-2 border-b overflow-x-auto pb-1"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        {[
          { id: 'appearance', label: 'Appearance & Themes (23)', icon: Palette, highlight: true },
          { id: 'store', label: 'Store Profile', icon: Store },
          { id: 'billing', label: 'Billing & Invoice Template', icon: Receipt },
          { id: 'demo', label: 'Demo Data Management', icon: RotateCcw },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                isSelected
                  ? 'border-indigo-600 font-extrabold'
                  : 'border-transparent opacity-65 hover:opacity-100'
              }`}
              style={isSelected ? {
                borderColor: 'var(--theme-primary)',
                color: 'var(--theme-primary)',
                backgroundColor: 'var(--theme-primary-light, rgba(79, 70, 229, 0.08))'
              } : {}}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPEARANCE & THEMES */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Header & Mode Switcher Card */}
          <div
            className="p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              borderColor: 'var(--theme-border)'
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                  Design System
                </span>
                <span>•</span>
                <span className="text-xs opacity-70">Active: <strong>{activeTheme.name}</strong></span>
              </div>
              <h2 className="text-lg font-bold mt-1">21 Aesthetic Color Themes + Legacy Originals</h2>
              <p className="text-xs opacity-75 mt-0.5 max-w-xl">
                Select and live preview luxury, modern tech, or minimal aesthetic palettes. Changes apply consistently across POS billing, sidebars, cards, and tables.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Light / Dark Mode Toggle */}
              <div
                className="flex items-center p-1 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-main)' }}
              >
                <button
                  type="button"
                  onClick={() => mode === 'dark' && toggleMode()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    mode === 'light'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => mode === 'light' && toggleMode()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    mode === 'dark'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </button>
              </div>

              {/* Subscription Pill */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-main)' }}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>All 23 Themes Permitted</span>
              </div>
            </div>
          </div>

          {/* Theme Category Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {THEME_CATEGORIES.map(cat => {
                const isSelected = selectedThemeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedThemeCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'border opacity-70 hover:opacity-100'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: 'var(--theme-primary)' }
                        : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }
                    }
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search 23 themes..."
                value={themeSearchQuery}
                onChange={(e) => setThemeSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--theme-bg-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-main)'
                }}
              />
            </div>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredThemes.map(theme => {
              const isCurrentSaved = currentThemeId === theme.id;
              const isCurrentlyPreviewing = previewThemeId === theme.id;
              const isSelected = isCurrentlyPreviewing || (!previewThemeId && isCurrentSaved);

              const colorSet = mode === 'dark' && theme.dark ? theme.dark : theme.colors;

              return (
                <div
                  key={theme.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 relative group ${
                    isSelected ? 'ring-2 shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: 'var(--theme-bg-card)',
                    borderColor: isSelected ? 'var(--theme-primary)' : 'var(--theme-border)',
                    boxShadow: isSelected ? '0 8px 24px -4px rgba(0,0,0,0.1)' : undefined
                  }}
                >
                  {/* Top Bar: Title & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                          {theme.name}
                        </h3>
                        {theme.subtitle && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {theme.subtitle}
                          </span>
                        )}
                      </div>

                      {isCurrentSaved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : isCurrentlyPreviewing ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 shrink-0 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider shrink-0">
                          {theme.category}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      {theme.description}
                    </p>

                    {/* Color Swatch Palette Preview (4 swatches) */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 mb-4">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
                        <span>Color Palette Tokens</span>
                        <span className="font-mono">{colorSet.primary}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1 text-center">
                          <div
                            className="h-8 rounded-lg shadow-2xs border border-black/10 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: colorSet.primary }}
                            title={`Primary: ${colorSet.primary}`}
                          />
                          <span className="text-[9px] text-slate-400 font-mono block truncate">Primary</span>
                        </div>

                        <div className="space-y-1 text-center">
                          <div
                            className="h-8 rounded-lg shadow-2xs border border-slate-300 dark:border-slate-700 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: colorSet.bgMain }}
                            title={`Background: ${colorSet.bgMain}`}
                          />
                          <span className="text-[9px] text-slate-400 font-mono block truncate">Canvas</span>
                        </div>

                        <div className="space-y-1 text-center">
                          <div
                            className="h-8 rounded-lg shadow-2xs border border-black/10 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: colorSet.bgSidebar }}
                            title={`Sidebar: ${colorSet.bgSidebar}`}
                          />
                          <span className="text-[9px] text-slate-400 font-mono block truncate">Sidebar</span>
                        </div>

                        <div className="space-y-1 text-center">
                          <div
                            className="h-8 rounded-lg shadow-2xs border border-black/10 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: colorSet.accent }}
                            title={`Accent: ${colorSet.accent}`}
                          />
                          <span className="text-[9px] text-slate-400 font-mono block truncate">Accent</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Miniature UI Mockup */}
                    <div
                      className="rounded-xl p-3 border mb-4 text-[11px] overflow-hidden"
                      style={{
                        backgroundColor: colorSet.bgMain,
                        borderColor: colorSet.border
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3.5 h-3.5 rounded-md flex items-center justify-center text-[8px] text-white font-bold"
                          style={{ backgroundColor: colorSet.primary }}
                        >
                          POS
                        </div>
                        <div
                          className="h-2 rounded w-16"
                          style={{ backgroundColor: colorSet.border }}
                        />
                        <div
                          className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded"
                          style={{ backgroundColor: colorSet.primaryLight, color: colorSet.primary }}
                        >
                          ₹1,450
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-7 rounded-md"
                          style={{ backgroundColor: colorSet.bgSidebar }}
                        />
                        <div
                          className="flex-1 h-7 rounded-md flex items-center justify-center font-bold text-[9px] text-white shadow-2xs"
                          style={{ backgroundColor: colorSet.primary }}
                        >
                          Pay Bill (F8)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => previewTheme(theme.id)}
                        className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          isCurrentlyPreviewing
                            ? 'bg-amber-500 text-white border-amber-600 font-bold'
                            : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        title="Live preview across entire interface"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isCurrentlyPreviewing ? 'Previewing' : 'Live Preview'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => saveTheme(theme.id, false)}
                        className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs transition-all ${
                          isCurrentSaved
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
                        title="Apply and remember for my cashier/user session"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{isCurrentSaved ? 'Saved' : 'Apply'}</span>
                      </button>
                    </div>

                    {/* Admin Action: Global Showroom Default */}
                    <button
                      type="button"
                      onClick={() => saveTheme(theme.id, true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                      title="Set as the baseline default theme for all showroom terminals"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Set as Showroom Global Default</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STORE PROFILE */}
      {activeTab === 'store' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Store Identity & Registration Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store / Legal Trade Name *</label>
              <input
                type="text"
                value={formData.store.storeName}
                onChange={(e) => handleStoreChange('storeName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Brand Slogan</label>
              <input
                type="text"
                value={formData.store.tagline}
                onChange={(e) => handleStoreChange('tagline', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Showroom Address *</label>
              <input
                type="text"
                value={formData.store.address}
                onChange={(e) => handleStoreChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.store.city}
                onChange={(e) => handleStoreChange('city', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State & State Code</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.store.state}
                  onChange={(e) => handleStoreChange('state', e.target.value)}
                  className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="33"
                  value={formData.store.stateCode}
                  onChange={(e) => handleStoreChange('stateCode', e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-center focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp Numbers</label>
              <input
                type="text"
                value={formData.store.phone}
                onChange={(e) => handleStoreChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Email</label>
              <input
                type="email"
                value={formData.store.email}
                onChange={(e) => handleStoreChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number *</label>
              <input
                type="text"
                value={formData.store.gstin}
                onChange={(e) => handleStoreChange('gstin', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PAN Card Number</label>
              <input
                type="text"
                value={formData.store.pan}
                onChange={(e) => handleStoreChange('pan', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Save Store Profile
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: BILLING & INVOICE TEMPLATE */}
      {activeTab === 'billing' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Invoice Numbering & Tax Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={formData.billing.invoicePrefix}
                onChange={(e) => handleBillingChange('invoicePrefix', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Sequence #</label>
              <input
                type="number"
                value={formData.billing.nextSequence}
                onChange={(e) => handleBillingChange('nextSequence', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default GST Rate (%)</label>
              <select
                value={formData.billing.defaultGSTRate}
                onChange={(e) => handleBillingChange('defaultGSTRate', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-hidden focus:border-indigo-500"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Apparel & Sarees &lt; ₹1,000)</option>
                <option value={12}>12% (Apparel &gt; ₹1,000)</option>
                <option value={18}>18% (Luxury Fabrics & Zari)</option>
              </select>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 pt-3 pb-2 border-b border-slate-100">
            Counter Workflow & Thermal Printer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Paper Size</label>
              <select
                value={formData.billing.defaultPaperSize}
                onChange={(e) => handleBillingChange('defaultPaperSize', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              >
                <option value="80mm">80mm Thermal Receipt (ESC/POS Standard)</option>
                <option value="58mm">58mm Thermal Receipt (Compact)</option>
                <option value="A4">A4 Full Page GST Tax Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pricing Mode</label>
              <select
                value={formData.billing.pricingMode}
                onChange={(e) => handleBillingChange('pricingMode', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              >
                <option value="inclusive">Tax Inclusive (MRP includes GST)</option>
                <option value="exclusive">Tax Exclusive (GST added at bill end)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Payment Method</label>
              <select
                value={formData.billing.defaultPaymentMethod}
                onChange={(e) => handleBillingChange('defaultPaymentMethod', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cashier Station Identifier</label>
            <input
              type="text"
              value={formData.billing.cashierName}
              onChange={(e) => handleBillingChange('cashierName', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions (Printed on Invoice Footer)</label>
            <textarea
              rows={3}
              value={formData.billing.termsAndConditions}
              onChange={(e) => handleBillingChange('termsAndConditions', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Save Billing Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: DEMO DATA MANAGEMENT */}
      {activeTab === 'demo' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Demo Data Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Restore factory demo data (40+ textile products, 20+ customers, 30+ invoices)
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <h5 className="font-bold">Resetting demo data</h5>
              <p className="mt-0.5 text-amber-700">
                This will overwrite any newly added products, customers, or bills created during this session and reload the initial demo data set.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Default Demo Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <ConfirmDialog
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={() => {
            resetDemoData();
            setIsResetConfirmOpen(false);
          }}
          title="Reset All Demo Data?"
          message="Are you sure you want to restore all original mock products, customers, and transactions? All local modifications will be replaced."
          confirmText="Yes, Reset Everything"
          isDestructive={true}
        />
      )}
    </div>
  );
};
