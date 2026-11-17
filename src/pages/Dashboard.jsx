import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  Banknote,
  QrCode,
  CreditCard,
  PlusCircle,
  Eye,
  Shirt,
  Calendar,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { reportService } from '../services/reportService';
import { StatCard } from '../components/common/StatCard';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const defaultMetrics = {
  todaySales: 0,
  todayInvoiceCount: 0,
  avgBillValue: 0,
  cashCollection: 0,
  upiCollection: 0,
  cardCollection: 0,
  salesTrend: [
    { date: 'Day 1', sales: 0, count: 0 },
    { date: 'Day 2', sales: 0, count: 0 },
    { date: 'Day 3', sales: 0, count: 0 },
    { date: 'Day 4', sales: 0, count: 0 },
    { date: 'Day 5', sales: 0, count: 0 },
    { date: 'Day 6', sales: 0, count: 0 },
    { date: 'Today', sales: 0, count: 0 },
  ],
  paymentBreakdown: [
    { name: 'UPI', value: 0, color: '#4f46e5' },
    { name: 'Cash', value: 0, color: '#10b981' },
    { name: 'Card', value: 0, color: '#f59e0b' }
  ],
  topSellingProducts: [],
  recentInvoices: []
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { invoices, settings } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const data = await reportService.getDashboardMetrics();
        if (isMounted && data) {
          setMetrics({
            ...defaultMetrics,
            ...data,
            salesTrend: data.salesTrend?.length ? data.salesTrend : defaultMetrics.salesTrend,
            paymentBreakdown: data.paymentBreakdown?.length ? data.paymentBreakdown : defaultMetrics.paymentBreakdown,
            topSellingProducts: data.topSellingProducts || [],
            recentInvoices: data.recentInvoices || []
          });
        }
      } catch (err) {
        console.warn('Failed to load backend metrics:', err);
      } finally {
        if (isMounted) setLoadingMetrics(false);
      }
    };

    fetchMetrics();
    return () => { isMounted = false; };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Store Overview</span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
            {settings?.store?.storeName || 'Sri Meenakshi Silks'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
            <span>Terminal: {settings?.billing?.cashierName || 'Cashier 01'}</span>
            <span>•</span>
            <span>Pricing Mode: <strong className="capitalize">{settings?.billing?.pricingMode || 'inclusive'}</strong></span>
          </p>
        </div>

        <button
          onClick={() => navigate('/pos')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Billing (F2)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(metrics.todaySales)}
          subtitle="Net collected today"
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Today's Bills"
          value={`${metrics.todayInvoiceCount} Bills`}
          subtitle="Completed transactions"
          icon={Receipt}
          color="sky"
        />
        <StatCard
          title="Avg Bill Value"
          value={formatCurrency(metrics.avgBillValue)}
          subtitle="Per customer basket"
          icon={Layers}
          color="amber"
        />
        <StatCard
          title="Cash Collection"
          value={formatCurrency(metrics.cashCollection)}
          subtitle="Liquid cash in drawer"
          icon={Banknote}
          color="emerald"
        />
        <StatCard
          title="UPI / QR Sales"
          value={formatCurrency(metrics.upiCollection)}
          subtitle="Soundbox & digital"
          icon={QrCode}
          color="indigo"
        />
        <StatCard
          title="Card Sales"
          value={formatCurrency(metrics.cardCollection)}
          subtitle="POS terminal settlements"
          icon={CreditCard}
          color="rose"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Daily Sales Overview (Last 7 Days)</h3>
              <p className="text-xs text-slate-400">Total revenue generated per day</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Live Transactions
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.salesTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Payment Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution by settlement method</p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {metrics.paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Collected']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
            {metrics.paymentBreakdown.map(p => (
              <div key={p.name}>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{p.name}</span>
                <span className="font-bold text-slate-800">{formatCurrency(p.value, false)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Grid: Top Selling Products & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top-Selling Textile Products</h3>
              <p className="text-xs text-slate-400">Leaderboard by transaction volume</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View Report →
            </button>
          </div>

          <div className="space-y-3">
            {metrics.topSellingProducts.map((prod, idx) => (
              <div
                key={prod.id || idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{prod.name}</h5>
                    <span className="text-[10px] text-slate-500">{prod.fabric}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">{formatCurrency(prod.revenue)}</span>
                  <span className="text-[10px] text-slate-500">{prod.quantity} Units Sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Completed Invoices</h3>
              <p className="text-xs text-slate-400">Latest checkout receipts</p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              All Invoices →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2">Invoice #</th>
                  <th className="py-2 px-2">Customer</th>
                  <th className="py-2 px-2">Payment</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium truncate max-w-[120px]">
                      {inv.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {inv.payment?.method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                      {formatCurrency(inv.summary?.netPayable || 0)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View / Print Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Preview & Print Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          settings={settings}
        />
      )}
    </div>
  );
};
