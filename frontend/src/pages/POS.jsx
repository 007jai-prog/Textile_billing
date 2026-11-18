import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Search,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/pos/ProductCard';
import { VariantPickerModal } from '../components/pos/VariantPickerModal';
import { CartPanel } from '../components/pos/CartPanel';
import { CustomerSelectModal } from '../components/pos/CustomerSelectModal';
import { PaymentModal } from '../components/pos/PaymentModal';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { formatCurrency } from '../utils/formatters';

export const POS = () => {
  const {
    products = [],
    customers,
    settings,
    addCustomer,
    showToast,
  } = useApp();

  const {
    cartItems,
    customer,
    setCustomer,
    cartTotals,
    addToCart,
    completeCheckout,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isSuccessOpen,
    setIsSuccessOpen,
    lastCompletedInvoice,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F4') {
        event.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (event.key === 'F8') {
        event.preventDefault();

        if (cartItems.length > 0) {
          setIsCheckoutOpen(true);
        } else {
          showToast('Cannot checkout with an empty cart.', 'error');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, showToast, setIsCheckoutOpen]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory;

      if (!query) return matchesCategory;

      const matchesName = String(product.name || '')
        .toLowerCase()
        .includes(query);
      const matchesFabric = String(product.fabric || '')
        .toLowerCase()
        .includes(query);
      const matchesBrand = String(product.brand || '')
        .toLowerCase()
        .includes(query);
      const matchesVariant = (product.variants || []).some((variant) =>
        String(variant.sku || '').toLowerCase().includes(query),
      );

      return (
        matchesCategory &&
        (matchesName || matchesFabric || matchesBrand || matchesVariant)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProductCardClick = (product) => {
    if (product.variants?.length === 1) {
      addToCart(product.variants[0], product, 1);
    } else {
      setSelectedProductForVariant(product);
    }
  };

  const categories = [
    'All',
    'Sarees',
    'Dhotis',
    'Kurtas',
    'Lehengas',
    'Suits',
    'Fabrics',
  ];

  return (
    <div className="flex flex-col gap-3 min-h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-5.5rem)] lg:flex-row pb-16 lg:pb-0">
      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          style={mobileTab === 'catalog' ? { color: 'var(--theme-primary)' } : {}}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Products Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'cart'
              ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          style={mobileTab === 'cart' ? { color: 'var(--theme-primary)' } : {}}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cart ({cartTotals.totalQuantity})</span>
          {cartTotals.netPayable > 0 && (
            <span className="font-extrabold text-[11px] opacity-90">
              • {formatCurrency(cartTotals.netPayable, false)}
            </span>
          )}
        </button>
      </div>

      {/* Product catalogue */}
      <section
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border p-3 sm:p-4 shadow-xs transition-colors ${
          mobileTab !== 'catalog' ? 'hidden lg:flex' : 'flex'
        }`}
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {/* Search */}
        <div className="mb-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products by name, brand, fabric, or SKU..."
              aria-label="Search products"
              className="w-full rounded-xl border bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800"
              style={{ borderColor: 'var(--theme-border)' }}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: 'var(--theme-primary)',
                        color: 'var(--theme-primary-text)',
                      }
                    : undefined
                }
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Product grid */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {products.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
              <Sparkles className="mb-2 h-10 w-10 text-indigo-400" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                Catalogue is Ready &amp; Clean
              </p>
              <p className="mb-4 mt-1 max-w-sm text-xs text-slate-500">
                Your store starts with zero initial inventory. Add your products
                to begin billing.
              </p>
              <a
                href="/products"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-indigo-500"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                + Add Products
              </a>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
              <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No products matching &quot;{searchQuery}&quot;
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Try another search or clear the filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cart and billing panel */}
      <div
        className={`h-full w-full shrink-0 lg:w-96 ${
          mobileTab !== 'cart' ? 'hidden lg:block' : 'block'
        }`}
      >
        <CartPanel
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
          onOpenPaymentModal={() => setIsCheckoutOpen(true)}
        />
      </div>

      {/* Floating Bottom Cart Bar on Mobile when browsing catalog (< lg) */}
      {mobileTab === 'catalog' && cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 p-3 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 font-medium block">
                {cartTotals.totalQuantity} items in Cart
              </span>
              <span className="text-sm font-extrabold text-white">
                {formatCurrency(cartTotals.netPayable)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              View Cart
            </button>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow transition-all flex items-center gap-1"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <span>Pay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Variant picker */}
      {selectedProductForVariant && (
        <VariantPickerModal
          isOpen={Boolean(selectedProductForVariant)}
          onClose={() => setSelectedProductForVariant(null)}
          product={selectedProductForVariant}
          onAddToCart={addToCart}
        />
      )}

      {/* Customer selection */}
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        selectedCustomer={customer}
        onSelectCustomer={setCustomer}
        onAddNewCustomer={addCustomer}
      />

      {/* Checkout */}
      <PaymentModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totals={cartTotals}
        customer={customer}
        onCompletePayment={completeCheckout}
        defaultMethod={settings?.billing?.defaultPaymentMethod || 'Cash'}
      />

      {/* Checkout success and invoice preview */}
      {lastCompletedInvoice && (
        <InvoicePreviewModal
          isOpen={isSuccessOpen}
          onClose={() => setIsSuccessOpen(false)}
          invoice={lastCompletedInvoice}
          settings={settings}
        />
      )}
    </div>
  );
};