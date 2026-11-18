import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Receipt,
  Percent,
  Coins,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { reportService } from '../services/reportService';
import { exportService } from '../services/exportService';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency } from '../utils/formatters';
import { mockInvoices } from '../data/mockInvoices';

const defaultReport = {
  dateRange: { start: '-', end: '-' },
  invoiceCount: 0,
  totalRevenue: 0,
  totalDiscount: 0,
  totalTaxable: 0,
  totalCGST: 0,
  totalSGST: 0,
  totalTax: 0,
  paymentBreakdown: { cash: 0, upi: 0, card: 0 },
  taxSlabs: [],
  productSales: []
};

// Client calculation fallback for seamless offline / in-memory performance
const computeClientSalesReport = (invoicesList, range, customStart, customEnd) => {
  const now = dayjs();
  let startStr = now.format('YYYY-MM-01');
  let endStr = now.format('YYYY-MM-DD');

  if (range === 'today') {
    startStr = now.format('YYYY-MM-DD');
    endStr = now.format('YYYY-MM-DD');
  } else if (range === 'yesterday') {
    startStr = now.subtract(1, 'day').format('YYYY-MM-DD');
    endStr = now.subtract(1, 'day').format('YYYY-MM-DD');
  } else if (range === 'this_week') {
    startStr = now.startOf('week').format('YYYY-MM-DD');
    endStr = now.format('YYYY-MM-DD');
  } else if (range === 'last_7_days') {
    startStr = now.subtract(6, 'day').format('YYYY-MM-DD');
    endStr = now.format('YYYY-MM-DD');
  } else if (range === 'this_month') {
    startStr = now.format('YYYY-MM-01');
    endStr = now.format('YYYY-MM-DD');
  } else if (range === 'this_year') {
    startStr = now.format('YYYY-01-01');
    endStr = now.format('YYYY-MM-DD');
  } else if (range === 'custom' && customStart && customEnd) {
    startStr = customStart;
    endStr = customEnd;
  }

  const sourceInvoices = (invoicesList && invoicesList.length > 0) ? invoicesList : mockInvoices;

  const filtered = sourceInvoices.filter(inv => {
    const invDate = String(inv.date || '').slice(0, 10);
    if (!invDate) return true;
    return invDate >= startStr && invDate <= endStr;
  });

  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalTax = 0;
  let cashCol = 0;
  let upiCol = 0;
  let cardCol = 0;

  const taxSlabsMap = {
    5: { rate: 5, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    12: { rate: 12, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    18: { rate: 18, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  };

  const productMap = {};

  filtered.forEach(inv => {
    const net = Number(inv.summary?.netPayable ?? inv.summary?.grandTotal ?? 0);
    totalRevenue += net;
    totalDiscount += Number(inv.summary?.totalDiscount ?? 0);
    totalTaxable += Number(inv.summary?.taxableSubtotal ?? (net * 0.95));
    totalCGST += Number(inv.summary?.totalCGST ?? (net * 0.025));
    totalSGST += Number(inv.summary?.totalSGST ?? (net * 0.025));
    totalTax += Number(inv.summary?.totalTax ?? (net * 0.05));

    const method = inv.payment?.method || 'Cash';
    if (method === 'Cash') cashCol += net;
    else if (method === 'UPI') upiCol += net;
    else if (method === 'Card') cardCol += net;
    else if (method === 'Split' && inv.payment?.splitDetails) {
      cashCol += Number(inv.payment.splitDetails.cash || 0);
      upiCol += Number(inv.payment.splitDetails.upi || 0);
      cardCol += Number(inv.payment.splitDetails.card || 0);
    }

    (inv.items || []).forEach(item => {
      const rate = Math.round(Number(item.gstRate || 5));
      if (!taxSlabsMap[rate]) {
        taxSlabsMap[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
      }
      taxSlabsMap[rate].taxable += Number(item.taxableAmount || (item.lineTotal || 0) * 0.95);
      taxSlabsMap[rate].cgst += Number(item.cgstAmount || (item.taxAmount || 0) / 2);
      taxSlabsMap[rate].sgst += Number(item.sgstAmount || (item.taxAmount || 0) / 2);
      taxSlabsMap[rate].totalTax += Number(item.taxAmount || 0);

      const pKey = item.productId || item.name;
      if (!productMap[pKey]) {
        productMap[pKey] = {
          name: item.name || 'Textile Item',
          sku: item.sku || '-',
          fabric: item.fabric || '-',
          unitsSold: 0,
          discount: 0,
          revenue: 0,
        };
      }
      productMap[pKey].unitsSold += Number(item.quantity || 1);
      productMap[pKey].discount += Number(item.itemDiscountAmount || 0);
      productMap[pKey].revenue += Number(item.lineTotal || (item.unitPrice * (item.quantity || 1)));
    });
  });

  return {
    dateRange: { start: startStr, end: endStr },
    invoiceCount: filtered.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalCGST: Math.round(totalCGST * 100) / 100,
    totalSGST: Math.round(totalSGST * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    paymentBreakdown: {
      cash: Math.round(cashCol * 100) / 100,
      upi: Math.round(upiCol * 100) / 100,
      card: Math.round(cardCol * 100) / 100,
    },
    taxSlabs: Object.values(taxSlabsMap),
    productSales: Object.values(productMap).sort((a, b) => b.revenue - a.revenue)
  };
};

export const Reports = () => {
  const { invoices } = useApp();

  const [rangeType, setRangeType] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [report, setReport] = useState(defaultReport);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const data = await reportService.getSalesReport(
          rangeType,
          rangeType === 'custom' ? customStart : null,
          rangeType === 'custom' ? customEnd : null
        );
        if (isMounted && data && (data.invoiceCount > 0 || (invoices && invoices.length === 0))) {
          setReport({
            ...defaultReport,
            ...data,
            paymentBreakdown: { ...defaultReport.paymentBreakdown, ...(data.paymentBreakdown || {}) },
            taxSlabs: data.taxSlabs || [],
            productSales: data.productSales || []
          });
          return;
        }
      } catch (err) {
        console.warn('Backend report endpoint unavailable or empty, computing in-memory report:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }

      // In-memory calculation fallback
      if (isMounted) {
        const computed = computeClientSalesReport(invoices, rangeType, customStart, customEnd);
        setReport(computed);
      }
    };

    fetchReport();
    return () => { isMounted = false; };
  }, [invoices, rangeType, customStart, customEnd]);

  const handleExportProductSalesCSV = () => {
    const rows = report.productSales.map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      sku: p.sku || '-',
      fabric: p.fabric || '-',
      unitsSold: p.unitsSold,
      revenue: p.revenue,
      discount: p.discount,
    }));

    exportService.exportToCSV(`Product_Sales_${rangeType}`, rows, [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Product Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'fabric', label: 'Fabric' },
      { key: 'unitsSold', label: 'Units Sold' },
      { key: 'discount', label: 'Discount Given (₹)' },
      { key: 'revenue', label: 'Net Revenue (₹)' },
    ]);
  };

  const handleExportGSTReportCSV = () => {
    const rows = report.taxSlabs.map(slab => ({
      rate: `${slab.rate}%`,
      taxable: slab.taxable,
      cgst: slab.cgst,
      sgst: slab.sgst,
      totalTax: slab.totalTax,
    }));

    exportService.exportToCSV(`GST_Summary_${rangeType}`, rows, [
      { key: 'rate', label: 'GST Slab' },
      { key: 'taxable', label: 'Taxable Value (₹)' },
      { key: 'cgst', label: 'CGST Collected (₹)' },
      { key: 'sgst', label: 'SGST Collected (₹)' },
      { key: 'totalTax', label: 'Total GST (₹)' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-xs transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)'
        }}
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
            Sales & GST Tax Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Period: <span className="font-semibold" style={{ color: 'var(--theme-primary)' }}>{report.dateRange.start}</span> to{' '}
            <span className="font-semibold" style={{ color: 'var(--theme-primary)' }}>{report.dateRange.end}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportGSTReportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border text-xs font-semibold rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-main)'
            }}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export GST CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportProductSalesCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors"
            style={{
              backgroundColor: 'var(--theme-primary)',
              color: 'var(--theme-primary-text)'
            }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Product CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div
        className="p-3.5 rounded-2xl border shadow-xs flex flex-wrap items-center gap-2 transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)'
        }}
      >
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Period:</span>
        {[
          { id: 'today', label: 'Today' },
          { id: 'yesterday', label: 'Yesterday' },
          { id: 'this_week', label: 'This Week' },
          { id: 'last_7_days', label: 'Last 7 Days' },
          { id: 'this_month', label: 'This Month' },
          { id: 'this_year', label: 'This Year' },
          { id: 'custom', label: 'Custom Range' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRangeType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              rangeType === tab.id
                ? 'shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
            style={rangeType === tab.id ? {
              backgroundColor: 'var(--theme-primary)',
              color: 'var(--theme-primary-text)'
            } : {}}
          >
            {tab.label}
          </button>
        ))}

        {rangeType === 'custom' && (
          <div className="flex items-center gap-2 pl-2 border-l ml-auto" style={{ borderColor: 'var(--theme-border)' }}>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
              style={{ borderColor: 'var(--theme-border)' }}
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
              style={{ borderColor: 'var(--theme-border)' }}
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Period Sales Revenue"
          value={formatCurrency(report.totalRevenue)}
          subtitle="Total net collected"
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Invoices Billed"
          value={`${report.invoiceCount} Bills`}
          subtitle="Recorded transactions"
          icon={Receipt}
          color="sky"
        />
        <StatCard
          title="Discounts Given"
          value={formatCurrency(report.totalDiscount)}
          subtitle="Item & bill discounts"
          icon={Percent}
          color="amber"
        />
        <StatCard
          title="Net GST Collected"
          value={formatCurrency(report.totalTax)}
          subtitle="CGST + SGST tax output"
          icon={Coins}
          color="emerald"
        />
      </div>

      {/* Payment Collections Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-2xl border shadow-xs flex items-center gap-3 transition-colors"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Collections</span>
            <h4 className="text-base font-extrabold" style={{ color: 'var(--theme-text-main)' }}>
              {formatCurrency(report.paymentBreakdown.cash)}
            </h4>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border shadow-xs flex items-center gap-3 transition-colors"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-primary)'
            }}
          >
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI / QR Collections</span>
            <h4 className="text-base font-extrabold" style={{ color: 'var(--theme-text-main)' }}>
              {formatCurrency(report.paymentBreakdown.upi)}
            </h4>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border shadow-xs flex items-center gap-3 transition-colors"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Card Collections</span>
            <h4 className="text-base font-extrabold" style={{ color: 'var(--theme-text-main)' }}>
              {formatCurrency(report.paymentBreakdown.card)}
            </h4>
          </div>
        </div>
      </div>

      {/* GST Summary Slab Table */}
      <div
        className="p-5 rounded-2xl border shadow-xs space-y-3 transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text-main)' }}>
              GST Output Tax Summary (GSTR-1 Format)
            </h3>
            <p className="text-xs text-slate-400">Breakup by tax slab for accountant filing</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
            Tamil Nadu (33) Intra-State
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <tr>
                <th className="py-2.5 px-3">GST Slab</th>
                <th className="py-2.5 px-3 text-right">Taxable Turnover</th>
                <th className="py-2.5 px-3 text-right">CGST</th>
                <th className="py-2.5 px-3 text-right">SGST</th>
                <th className="py-2.5 px-3 text-right">Total Tax Output</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium" style={{ borderColor: 'var(--theme-border)' }}>
              {report.taxSlabs.map(slab => (
                <tr key={slab.rate} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--theme-primary)' }}>
                    {slab.rate}% GST
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">{formatCurrency(slab.taxable)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(slab.cgst)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(slab.sgst)}</td>
                  <td className="py-2.5 px-3 text-right font-bold" style={{ color: 'var(--theme-text-main)' }}>
                    {formatCurrency(slab.totalTax)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t" style={{ borderColor: 'var(--theme-border)' }}>
                <td className="py-2.5 px-3" style={{ color: 'var(--theme-text-main)' }}>TOTAL</td>
                <td className="py-2.5 px-3 text-right" style={{ color: 'var(--theme-text-main)' }}>{formatCurrency(report.totalTaxable)}</td>
                <td className="py-2.5 px-3 text-right" style={{ color: 'var(--theme-text-main)' }}>{formatCurrency(report.totalCGST)}</td>
                <td className="py-2.5 px-3 text-right" style={{ color: 'var(--theme-text-main)' }}>{formatCurrency(report.totalSGST)}</td>
                <td className="py-2.5 px-3 text-right text-sm font-extrabold" style={{ color: 'var(--theme-primary)' }}>
                  {formatCurrency(report.totalTax)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Product-Wise Sales Table */}
      <div
        className="p-5 rounded-2xl border shadow-xs space-y-3 transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)'
        }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text-main)' }}>
            Product-Wise Sales Performance
          </h3>
          <p className="text-xs text-slate-400">Total units sold and revenue per textile product</p>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b sticky top-0" style={{ borderColor: 'var(--theme-border)' }}>
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Fabric</th>
                <th className="py-2.5 px-3 text-center">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Discounts</th>
                <th className="py-2.5 px-3 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {report.productSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No sales recorded for this date range.
                  </td>
                </tr>
              ) : (
                report.productSales.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400 text-[10px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--theme-text-main)' }}>
                      <div>{p.name}</div>
                      {p.sku && <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.fabric}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">{p.unitsSold}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {p.discount > 0 ? formatCurrency(p.discount) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold" style={{ color: 'var(--theme-text-main)' }}>
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
