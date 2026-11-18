import React from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const getEffectivePrice = (product, variant) => {
  const hasVariantPrice =
    variant?.priceOverride === true &&
    Number.isFinite(Number(variant.price));

  const price = hasVariantPrice ? variant.price : product.price;
  const parsedPrice = Number(price);

  return Number.isFinite(parsedPrice) ? parsedPrice : 0;
};

export const ProductCard = ({ product, onSelect }) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const variantCount = variants.length;

  const prices = variants.length
    ? variants.map((variant) => getEffectivePrice(product, variant))
    : [Number(product?.price) || 0];

  const lowestPrice = Math.min(...prices);
  const productMrp = Number(product?.mrp) || 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group relative flex cursor-pointer select-none flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-theme-card p-3 text-left transition-all hover:shadow-md dark:border-slate-800"
      style={{ borderColor: 'var(--theme-border)' }}
      aria-label={`Select ${product?.name || 'product'}`}
    >
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-1">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: 'var(--theme-primary)',
              backgroundColor: 'var(--theme-primary-light)',
            }}
          >
            {product?.category || 'Product'}
          </span>
          <span className="max-w-[100px] truncate text-[10px] text-slate-500">
            {product?.fabric || 'Textile'}
          </span>
        </div>

        <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100">
          {product?.name || 'Unnamed product'}
        </h4>
      </div>

      <div className="my-2 flex flex-wrap items-center gap-1">
        {variants.slice(0, 3).map((variant, index) => (
          <span
            key={variant.id || variant.sku || index}
            className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {variant.size || 'Variant'}
          </span>
        ))}
        {variantCount > 3 && (
          <span className="text-[9px] font-medium text-slate-400">
            +{variantCount - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
        <div>
          <div className="text-sm font-bold leading-none text-slate-900 dark:text-slate-100">
            {formatCurrency(lowestPrice)}
          </div>
          {productMrp > lowestPrice && (
            <div className="mt-0.5 text-[10px] text-slate-400 line-through">
              MRP {formatCurrency(productMrp)}
            </div>
          )}
        </div>

        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg shadow-sm"
          style={{
            backgroundColor: 'var(--theme-primary-light)',
            color: 'var(--theme-primary)',
          }}
          aria-hidden="true"
        >
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
};