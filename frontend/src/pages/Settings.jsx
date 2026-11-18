
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Store,
  Receipt,
  RotateCcw,
  Save,
  AlertTriangle,
  Palette,
  Eye,
  Check,
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
    mode,
    toggleMode,
    previewTheme,
    saveTheme
  } = useTheme();

  const [activeTab, setActiveTab] = useState(
    location.state?.tab || 'appearance'
  );

  const [selectedThemeCategory, setSelectedThemeCategory] = useState('all');
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [formData, setFormData] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Theme-aware styles
  const cardStyle = {
    backgroundColor: 'var(--theme-bg-card)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text-main)'
  };

  const inputStyle = {
    backgroundColor: 'var(--theme-bg-main)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text-main)',
    colorScheme: mode === 'dark' ? 'dark' : 'light'
  };

  const labelStyle = {
    color: 'var(--theme-text-muted)'
  };

  const headingStyle = {
    color: 'var(--theme-text-main)'
  };

  const mutedTextStyle = {
    color: 'var(--theme-text-muted)'
  };

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
    setFormData(prev => ({
      ...prev,
      store: {
        ...prev.store,
        [field]: value
      }
    }));
  };

  const handleBillingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      billing: {
        ...prev.billing,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
  };

  // Filter themes
  const filteredThemes = themes.filter(theme => {
    const matchesCategory =
      selectedThemeCategory === 'all' ||
      theme.category === selectedThemeCategory;

    const query = themeSearchQuery.toLowerCase().trim();

    if (!query) return matchesCategory;

    const matchesName = theme.name.toLowerCase().includes(query);
    const matchesSubtitle = (theme.subtitle || '').toLowerCase().includes(query);
    const matchesDescription = (theme.description || '').toLowerCase().includes(query);

    return matchesCategory &&
      (matchesName || matchesSubtitle || matchesDescription);
  });

  // Reusable form input styles
  const formInputClass =
    'w-full px-3 py-2 rounded-lg text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500';

  const renderLabel = (text) => (
    <label
      className="block text-xs font-bold mb-1"
      style={labelStyle}
    >
      {text}
    </label>
  );

  return (
    <div
      className="space-y-6 max-w-6xl mx-auto"
      style={headingStyle}
    >

      {/* TOP BANNER */}

      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-xs transition-colors"
        style={cardStyle}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">
              Showroom & POS Settings
            </h1>

            <Badge variant="primary" size="sm">
              <Crown className="w-3 h-3 mr-1 inline text-amber-500" />
              Enterprise Plan
            </Badge>
          </div>

          <p
            className="text-xs mt-0.5"
            style={mutedTextStyle}
          >
            Configure store profile, 21+ aesthetic themes, invoice formatting,
            and cash drawer settings
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

      {/* TABS */}

      <div
        className="flex items-center gap-2 border-b overflow-x-auto pb-1"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        {[
          { id: 'appearance', label: 'Appearance & Themes (23)', icon: Palette },
          { id: 'store', label: 'Store Profile', icon: Store },
          { id: 'billing', label: 'Billing & Invoice Template', icon: Receipt },
          { id: 'demo', label: 'Demo Data Management', icon: RotateCcw }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                isSelected
                  ? 'font-extrabold'
                  : 'border-transparent opacity-65 hover:opacity-100'
              }`}
              style={{
                borderColor: isSelected
                  ? 'var(--theme-primary)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--theme-primary)'
                  : 'var(--theme-text-muted)',
                backgroundColor: isSelected
                  ? 'var(--theme-primary-light)'
                  : 'transparent'
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================
          TAB 1: APPEARANCE & THEMES
      ===================================== */}

      {activeTab === 'appearance' && (
        <div className="space-y-6">

          {/* Header and Mode Switcher */}

          <div
            className="p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={cardStyle}
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs uppercase font-bold tracking-wider"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Design System
                </span>

                <span>•</span>

                <span
                  className="text-xs"
                  style={mutedTextStyle}
                >
                  Active: <strong>{activeTheme.name}</strong>
                </span>
              </div>

              <h2 className="text-lg font-bold mt-1">
                21 Aesthetic Color Themes + Legacy Originals
              </h2>

              <p
                className="text-xs mt-0.5 max-w-xl"
                style={mutedTextStyle}
              >
                Select and live preview luxury, modern tech, or minimal
                aesthetic palettes. Changes apply consistently across POS
                billing, sidebars, cards, and tables.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">

              {/* Light / Dark Toggle */}

              <div
                className="flex items-center p-1 rounded-xl border text-xs font-semibold"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-main)'
                }}
              >
                <button
                  type="button"
                  onClick={() => mode === 'dark' && toggleMode()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: mode === 'light'
                      ? 'var(--theme-bg-card)'
                      : 'transparent',
                    color: mode === 'light'
                      ? 'var(--theme-text-main)'
                      : 'var(--theme-text-muted)',
                    fontWeight: mode === 'light' ? 700 : 500
                  }}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => mode === 'light' && toggleMode()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: mode === 'dark'
                      ? 'var(--theme-bg-card)'
                      : 'transparent',
                    color: mode === 'dark'
                      ? 'var(--theme-text-main)'
                      : 'var(--theme-text-muted)',
                    fontWeight: mode === 'dark' ? 700 : 500
                  }}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </button>
              </div>

              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-main)'
                }}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>All 23 Themes Permitted</span>
              </div>
            </div>
          </div>

          {/* Theme Category Filters and Search */}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {THEME_CATEGORIES.map(category => {
                const isSelected =
                  selectedThemeCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedThemeCategory(category.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--theme-primary)'
                        : 'var(--theme-bg-card)',
                      color: isSelected
                        ? '#ffffff'
                        : 'var(--theme-text-main)',
                      borderColor: isSelected
                        ? 'var(--theme-primary)'
                        : 'var(--theme-border)'
                    }}
                  >
                    {category.label}
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
                className={formInputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Theme Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {filteredThemes.map(theme => {
              const isCurrentSaved = currentThemeId === theme.id;
              const isCurrentlyPreviewing = previewThemeId === theme.id;

              const isSelected =
                isCurrentlyPreviewing ||
                (!previewThemeId && isCurrentSaved);

              const colorSet =
                mode === 'dark' && theme.dark
                  ? theme.dark
                  : theme.colors;

              return (
                <div
                  key={theme.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 relative group ${
                    isSelected ? 'ring-2 shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: 'var(--theme-bg-card)',
                    borderColor: isSelected
                      ? 'var(--theme-primary)'
                      : 'var(--theme-border)',
                    color: 'var(--theme-text-main)',
                    boxShadow: isSelected
                      ? '0 8px 24px -4px rgba(0,0,0,0.1)'
                      : undefined
                  }}
                >
                  <div>

                    {/* Theme Name */}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-sm leading-tight">
                          {theme.name}
                        </h3>

                        {theme.subtitle && (
                          <span
                            className="text-[11px] font-semibold"
                            style={mutedTextStyle}
                          >
                            {theme.subtitle}
                          </span>
                        )}
                      </div>

                      {isCurrentSaved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : isCurrentlyPreviewing ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shrink-0 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider shrink-0"
                          style={{
                            backgroundColor: 'var(--theme-bg-main)',
                            color: 'var(--theme-text-muted)',
                            borderColor: 'var(--theme-border)'
                          }}
                        >
                          {theme.category}
                        </span>
                      )}
                    </div>

                    <p
                      className="text-xs leading-relaxed mb-4"
                      style={mutedTextStyle}
                    >
                      {theme.description}
                    </p>

                    {/* Color Swatches */}

                    <div
                      className="p-3 rounded-xl border mb-4"
                      style={{
                        backgroundColor: 'var(--theme-bg-main)',
                        borderColor: 'var(--theme-border)'
                      }}
                    >
                      <div className="text-[10px] uppercase font-bold mb-2 flex items-center justify-between">
                        <span style={mutedTextStyle}>
                          Color Palette Tokens
                        </span>

                        <span className="font-mono">
                          {colorSet.primary}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Primary', color: colorSet.primary },
                          { label: 'Canvas', color: colorSet.bgMain },
                          { label: 'Sidebar', color: colorSet.bgSidebar },
                          { label: 'Accent', color: colorSet.accent }
                        ].map(swatch => (
                          <div
                            key={swatch.label}
                            className="space-y-1 text-center"
                          >
                            <div
                              className="h-8 rounded-lg shadow-2xs border border-black/10"
                              style={{ backgroundColor: swatch.color }}
                              title={`${swatch.label}: ${swatch.color}`}
                            />

                            <span
                              className="text-[9px] font-mono block truncate"
                              style={mutedTextStyle}
                            >
                              {swatch.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Miniature UI Preview */}

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
                          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: colorSet.primaryLight,
                            color: colorSet.primary
                          }}
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

                  {/* Theme Actions */}

                  <div
                    className="space-y-2 pt-2 border-t"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    <div className="grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() => previewTheme(theme.id)}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all"
                        style={isCurrentlyPreviewing
                          ? {
                              backgroundColor: '#f59e0b',
                              color: '#ffffff',
                              borderColor: '#d97706'
                            }
                          : {
                              backgroundColor: 'var(--theme-bg-main)',
                              color: 'var(--theme-text-main)',
                              borderColor: 'var(--theme-border)'
                            }
                        }
                        title="Live preview across entire interface"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {isCurrentlyPreviewing ? 'Previewing' : 'Live Preview'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => saveTheme(theme.id, false)}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs transition-all"
                        style={{
                          backgroundColor: isCurrentSaved
                            ? '#059669'
                            : 'var(--theme-primary)'
                        }}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>
                          {isCurrentSaved ? 'Saved' : 'Apply'}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => saveTheme(theme.id, true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors"
                      style={mutedTextStyle}
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

      {/* =====================================
          TAB 2: STORE PROFILE
      ===================================== */}

      {activeTab === 'store' && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl border shadow-xs space-y-4"
          style={cardStyle}
        >
          <h3
            className="text-sm font-bold pb-2 border-b"
            style={{
              color: 'var(--theme-text-main)',
              borderColor: 'var(--theme-border)'
            }}
          >
            Store Identity & Registration Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              {renderLabel('Store / Legal Trade Name *')}

              <input
                type="text"
                value={formData.store.storeName}
                onChange={(e) => handleStoreChange('storeName', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('Tagline / Brand Slogan')}

              <input
                type="text"
                value={formData.store.tagline}
                onChange={(e) => handleStoreChange('tagline', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              />
            </div>

            <div className="sm:col-span-2">
              {renderLabel('Full Showroom Address *')}

              <input
                type="text"
                value={formData.store.address}
                onChange={(e) => handleStoreChange('address', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('City')}

              <input
                type="text"
                value={formData.store.city}
                onChange={(e) => handleStoreChange('city', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('State & State Code')}

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.store.state}
                  onChange={(e) => handleStoreChange('state', e.target.value)}
                  className={`col-span-2 ${formInputClass}`}
                  style={inputStyle}
                />

                <input
                  type="text"
                  placeholder="33"
                  value={formData.store.stateCode}
                  onChange={(e) => handleStoreChange('stateCode', e.target.value)}
                  className={`${formInputClass} text-center`}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              {renderLabel('Phone / WhatsApp Numbers')}

              <input
                type="text"
                value={formData.store.phone}
                onChange={(e) => handleStoreChange('phone', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('Store Email')}

              <input
                type="email"
                value={formData.store.email}
                onChange={(e) => handleStoreChange('email', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('GSTIN Number *')}

              <input
                type="text"
                value={formData.store.gstin}
                onChange={(e) => handleStoreChange('gstin', e.target.value)}
                className={`${formInputClass} font-mono uppercase font-semibold`}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('PAN Card Number')}

              <input
                type="text"
                value={formData.store.pan}
                onChange={(e) => handleStoreChange('pan', e.target.value)}
                className={`${formInputClass} font-mono uppercase font-semibold`}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              Save Store Profile
            </button>
          </div>
        </form>
      )}

      {/* =====================================
          TAB 3: BILLING & INVOICE TEMPLATE
      ===================================== */}

      {activeTab === 'billing' && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl border shadow-xs space-y-4"
          style={cardStyle}
        >
          <h3
            className="text-sm font-bold pb-2 border-b"
            style={{
              color: 'var(--theme-text-main)',
              borderColor: 'var(--theme-border)'
            }}
          >
            Invoice Numbering & Tax Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>
              {renderLabel('Invoice Prefix')}

              <input
                type="text"
                value={formData.billing.invoicePrefix}
                onChange={(e) => handleBillingChange('invoicePrefix', e.target.value)}
                className={`${formInputClass} font-mono font-bold`}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('Next Sequence #')}

              <input
                type="number"
                value={formData.billing.nextSequence}
                onChange={(e) => handleBillingChange('nextSequence', Number(e.target.value))}
                className={`${formInputClass} font-mono font-bold`}
                style={inputStyle}
              />
            </div>

            <div>
              {renderLabel('Default GST Rate (%)')}

              <select
                value={formData.billing.defaultGSTRate}
                onChange={(e) => handleBillingChange('defaultGSTRate', Number(e.target.value))}
                className={`${formInputClass} font-bold`}
                style={inputStyle}
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Apparel & Sarees &lt; ₹1,000)</option>
                <option value={12}>12% (Apparel &gt; ₹1,000)</option>
                <option value={18}>18% (Luxury Fabrics & Zari)</option>
              </select>
            </div>
          </div>

          <h3
            className="text-sm font-bold pt-3 pb-2 border-b"
            style={{
              color: 'var(--theme-text-main)',
              borderColor: 'var(--theme-border)'
            }}
          >
            Counter Workflow & Thermal Printer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>
              {renderLabel('Default Paper Size')}

              <select
                value={formData.billing.defaultPaperSize}
                onChange={(e) => handleBillingChange('defaultPaperSize', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              >
                <option value="80mm">80mm Thermal Receipt (ESC/POS Standard)</option>
                <option value="58mm">58mm Thermal Receipt (Compact)</option>
                <option value="A4">A4 Full Page GST Tax Invoice</option>
              </select>
            </div>

            <div>
              {renderLabel('Pricing Mode')}

              <select
                value={formData.billing.pricingMode}
                onChange={(e) => handleBillingChange('pricingMode', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              >
                <option value="inclusive">Tax Inclusive (MRP includes GST)</option>
                <option value="exclusive">Tax Exclusive (GST added at bill end)</option>
              </select>
            </div>

            <div>
              {renderLabel('Default Payment Method')}

              <select
                value={formData.billing.defaultPaymentMethod}
                onChange={(e) => handleBillingChange('defaultPaymentMethod', e.target.value)}
                className={formInputClass}
                style={inputStyle}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          <div>
            {renderLabel('Cashier Station Identifier')}

            <input
              type="text"
              value={formData.billing.cashierName}
              onChange={(e) => handleBillingChange('cashierName', e.target.value)}
              className={formInputClass}
              style={inputStyle}
            />
          </div>

          <div>
            {renderLabel('Terms & Conditions (Printed on Invoice Footer)')}

            <textarea
              rows={3}
              value={formData.billing.termsAndConditions}
              onChange={(e) => handleBillingChange('termsAndConditions', e.target.value)}
              className={formInputClass}
              style={inputStyle}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              Save Billing Settings
            </button>
          </div>
        </form>
      )}

      {/* =====================================
          TAB 4: DEMO DATA MANAGEMENT
      ===================================== */}

      {activeTab === 'demo' && (
        <div
          className="p-6 rounded-2xl border shadow-xs space-y-4"
          style={cardStyle}
        >
          <div>
            <h3 className="text-sm font-bold">
              Demo Data Management
            </h3>

            <p
              className="text-xs mt-0.5"
              style={mutedTextStyle}
            >
              Restore factory demo data (40+ textile products, 20+ customers,
              30+ invoices)
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />

            <div className="text-xs text-amber-900">
              <h5 className="font-bold">
                Resetting demo data
              </h5>

              <p className="mt-0.5 text-amber-700">
                This will overwrite any newly added products, customers, or
                bills created during this session and reload the initial
                demo data set.
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

      {/* RESET CONFIRMATION */}

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
