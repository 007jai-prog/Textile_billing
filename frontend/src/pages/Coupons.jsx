import React, { useState, useEffect } from 'react';
import {
  Tag,
  Percent,
  Calendar,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Flame,
  Gift,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';
import { couponService } from '../services/couponService';
import { festivalService } from '../services/festivalService';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

const festivalPresets = [
  { name: 'Pongal / Makar Sankranti Festival', start: '2026-01-12', end: '2026-01-18', val: 15, banner: '🌾 Happy Pongal Special: Flat 15% Off on All Silk Sarees!' },
  { name: 'Tamil New Year (Puthandu)', start: '2026-04-10', end: '2026-04-16', val: 12, banner: '✨ Puthandu Nalvazhthukkal: 12% Off on Festive Collections!' },
  { name: 'Diwali Grand Deepavali Mela', start: '2026-10-25', end: '2026-11-05', val: 20, banner: '🪔 Deepavali Grand Silk Bonanza: 20% Instant Discount!' },
  { name: 'Onam Silk Special', start: '2026-08-20', end: '2026-08-30', val: 10, banner: '🌸 Onam Celebrations: 10% Off on Kasavu & Traditional Sarees!' },
  { name: 'Navratri & Dussehra Festive Week', start: '2026-10-10', end: '2026-10-20', val: 15, banner: '🎉 Navratri Splendour: 15% Off on Designer Lehengas & Sarees!' },
  { name: 'Summer Wedding Bonanza', start: '2026-05-01', end: '2026-05-31', val: 10, banner: '💍 Muhurtham Special: 10% Off on Wedding Silk Sets!' }
];

const Coupons = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'festivals'

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponType, setCouponType] = useState('percent');
  const [couponValue, setCouponValue] = useState(10);
  const [couponMinBill, setCouponMinBill] = useState(1000);
  const [couponMaxDisc, setCouponMaxDisc] = useState(500);
  const [couponMaxUses, setCouponMaxUses] = useState(100);
  const [couponValidUntil, setCouponValidUntil] = useState('2026-12-31');
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  // Festival Offers State
  const [festivals, setFestivals] = useState([]);
  const [loadingFestivals, setLoadingFestivals] = useState(false);
  const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false);
  const [festName, setFestName] = useState('');
  const [festStart, setFestStart] = useState(new Date().toISOString().split('T')[0]);
  const [festEnd, setFestEnd] = useState('2026-12-31');
  const [festType, setFestType] = useState('percent');
  const [festValue, setFestValue] = useState(15);
  const [festMinBill, setFestMinBill] = useState(1500);
  const [festMaxDisc, setFestMaxDisc] = useState(1000);
  const [festBanner, setFestBanner] = useState('');
  const [isSavingFestival, setIsSavingFestival] = useState(false);

  // Load Coupons
  const loadCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const data = await couponService.getCoupons(false);
      setCoupons(data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Load Festival Offers
  const loadFestivals = async () => {
    try {
      setLoadingFestivals(true);
      const data = await festivalService.getOffers(false);
      setFestivals(data);
    } catch (err) {
      console.error('Error fetching festivals:', err);
    } finally {
      setLoadingFestivals(false);
    }
  };

  useEffect(() => {
    loadCoupons();
    loadFestivals();
  }, []);

  // Save Coupon
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }

    setIsSavingCoupon(true);
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        description: couponDesc.trim(),
        discount_type: couponType,
        discount_value: Number(couponValue),
        min_bill_amount: Number(couponMinBill) || 0,
        max_discount_amount: Number(couponMaxDisc) || 0,
        max_uses: Number(couponMaxUses) || null,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: couponValidUntil || '2026-12-31',
        is_active: true
      };

      await couponService.createCoupon(payload);
      showToast(`Coupon "${payload.code}" created successfully!`, 'success');
      setIsCouponModalOpen(false);
      setCouponCode('');
      setCouponDesc('');
      loadCoupons();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create coupon.';
      showToast(msg, 'error');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  // Toggle Coupon Active
  const handleToggleCoupon = async (c) => {
    try {
      await couponService.updateCoupon(c.id, { is_active: !c.is_active });
      setCoupons(prev => prev.map(item => item.id === c.id ? { ...item, is_active: !item.is_active } : item));
      showToast(`Coupon ${c.code} status updated.`, 'info');
    } catch (err) {
      showToast('Failed to update coupon status.', 'error');
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await couponService.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      showToast(`Coupon "${code}" deleted.`, 'info');
    } catch (err) {
      showToast('Failed to delete coupon.', 'error');
    }
  };

  // Save Festival Offer
  const handleSaveFestival = async (e) => {
    e.preventDefault();
    if (!festName.trim()) {
      showToast('Festival name is required', 'error');
      return;
    }

    setIsSavingFestival(true);
    try {
      const payload = {
        festival_name: festName.trim(),
        start_date: festStart,
        end_date: festEnd,
        discount_type: festType,
        discount_value: Number(festValue),
        min_bill_amount: Number(festMinBill) || 0,
        max_discount_amount: Number(festMaxDisc) || 0,
        banner_text: festBanner.trim() || `Special Festive Offer: ${festValue}% off!`,
        is_active: true
      };

      await festivalService.createOffer(payload);
      showToast(`Festival offer "${payload.festival_name}" created!`, 'success');
      setIsFestivalModalOpen(false);
      setFestName('');
      setFestBanner('');
      loadFestivals();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create festival offer.';
      showToast(msg, 'error');
    } finally {
      setIsSavingFestival(false);
    }
  };

  // Apply Festival Preset
  const handleApplyPreset = (preset) => {
    setFestName(preset.name);
    setFestStart(preset.start);
    setFestEnd(preset.end);
    setFestValue(preset.val);
    setFestType('percent');
    setFestMinBill(1000);
    setFestMaxDisc(2000);
    setFestBanner(preset.banner);
    setIsFestivalModalOpen(true);
  };

  // Delete Festival Offer
  const handleDeleteFestival = async (id, name) => {
    if (!window.confirm(`Delete festival offer "${name}"?`)) return;
    try {
      await festivalService.deleteOffer(id);
      setFestivals(prev => prev.filter(f => f.id !== id));
      showToast(`Festival offer "${name}" removed.`, 'info');
    } catch (err) {
      showToast('Failed to delete festival offer.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Coupons & Festival Offers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage promotional discount vouchers and automated Tamil festival calendar discounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'coupons' ? (
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon Code</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setFestName('');
                setFestBanner('');
                setIsFestivalModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Festival Offer</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'coupons'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promotional Coupons ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('festivals')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'festivals'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Festival & Calendar Offers ({festivals.length})</span>
        </button>
      </div>

      {/* TAB 1: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Store Discount Codes
              </span>
              <button
                onClick={loadCoupons}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh List</span>
              </button>
            </div>

            {loadingCoupons ? (
              <div className="p-12 text-center text-slate-400">Loading coupon records...</div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Gift className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  No Coupons Created Yet
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Create discount codes for festive campaigns, VIP customer discounts, or seasonal clearance.
                </p>
                <button
                  onClick={() => setIsCouponModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow hover:bg-indigo-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Coupon</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Coupon Code</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Min Bill / Max Cap</th>
                      <th className="py-3 px-4">Valid Until</th>
                      <th className="py-3 px-4">Redemptions</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded">
                              {c.code}
                            </span>
                          </div>
                          {c.description && (
                            <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">{c.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                          <div>Min: ₹{c.min_bill_amount || 0}</div>
                          {c.max_discount_amount > 0 && <div>Cap: ₹{c.max_discount_amount}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {c.valid_until || 'No Expiry'}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.times_used || 0}</span>
                          {c.max_uses && <span className="text-slate-400"> / {c.max_uses}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(c)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold"
                          >
                            {c.is_active ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FESTIVALS */}
      {activeTab === 'festivals' && (
        <div className="space-y-6">
          {/* Quick Festival Presets Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 rounded-2xl p-6 border border-amber-500/20">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Tamil & Indian Festival Presets</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Click any festival preset below to instantly stage an automatic showroom discount campaign.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {festivalPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-left p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all group"
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {p.val}% Off • {p.start} to {p.end}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Festival Campaigns Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Configured Festival Campaigns
              </span>
              <button
                onClick={loadFestivals}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh List</span>
              </button>
            </div>

            {loadingFestivals ? (
              <div className="p-12 text-center text-slate-400">Loading festival records...</div>
            ) : festivals.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Flame className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  No Festival Offers Configured
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Select a preset above or create a custom date range offer. When active, POS will auto-apply festival discounts!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Festival Campaign</th>
                      <th className="py-3 px-4">Date Range</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Min Bill / Max Cap</th>
                      <th className="py-3 px-4">Banner Preview</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {festivals.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{f.festival_name}</span>
                            {f.is_active && <Badge variant="success">Active</Badge>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {f.start_date} <span className="text-slate-400">to</span> {f.end_date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                          {f.discount_type === 'percent' ? `${f.discount_value}% OFF` : `₹${f.discount_value} OFF`}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                          <div>Min: ₹{f.min_bill_amount || 0}</div>
                          {f.max_discount_amount > 0 && <div>Cap: ₹{f.max_discount_amount}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {f.banner_text || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteFestival(f.id, f.festival_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Delete Offer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Create Store Promotional Coupon"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Coupon Code * (e.g. SILK15, PONGAL2026)
            </label>
            <input
              type="text"
              required
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="FESTIVE10"
              className="w-full uppercase font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              value={couponDesc}
              onChange={(e) => setCouponDesc(e.target.value)}
              placeholder="e.g. 10% Off on purchases over ₹2,000"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discount Type
              </label>
              <select
                value={couponType}
                onChange={(e) => setCouponType(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Rupee (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                required
                min="1"
                value={couponValue}
                onChange={(e) => setCouponValue(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Bill Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={couponMinBill}
                onChange={(e) => setCouponMinBill(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                value={couponMaxDisc}
                onChange={(e) => setCouponMaxDisc(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Usages Limit
              </label>
              <input
                type="number"
                min="1"
                value={couponMaxUses}
                onChange={(e) => setCouponMaxUses(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={couponValidUntil}
                onChange={(e) => setCouponValidUntil(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCouponModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingCoupon}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSavingCoupon ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Coupon</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE FESTIVAL OFFER MODAL */}
      <Modal
        isOpen={isFestivalModalOpen}
        onClose={() => setIsFestivalModalOpen(false)}
        title="Configure Festival Offer Campaign"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveFestival} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Festival Campaign Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deepavali Silk Mela"
              value={festName}
              onChange={(e) => setFestName(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={festStart}
                onChange={(e) => setFestStart(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={festEnd}
                onChange={(e) => setFestEnd(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discount Type
              </label>
              <select
                value={festType}
                onChange={(e) => setFestType(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Rupee (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                required
                min="1"
                value={festValue}
                onChange={(e) => setFestValue(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Bill Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={festMinBill}
                onChange={(e) => setFestMinBill(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                value={festMaxDisc}
                onChange={(e) => setFestMaxDisc(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Banner Tagline / Receipt Notice
            </label>
            <input
              type="text"
              placeholder="e.g. 🪔 Happy Deepavali: Flat 20% Off on Silk Sarees!"
              value={festBanner}
              onChange={(e) => setFestBanner(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFestivalModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingFestival}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSavingFestival ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Campaign</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Coupons;
