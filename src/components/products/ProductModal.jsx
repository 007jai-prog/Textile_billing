import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { mockCategories, mockFabrics } from '../../data/mockProducts';

const createDefaultFormData = () => ({
  name: '',
  category: 'Sarees',
  fabric: 'Kanchipuram Silk',
  brand: 'ChennaSilks Heritage',
  hsn: '5007',
  mrp: 2999,
  price: 2199,
  gstRate: 5,
  description: '',
  status: 'active',
  variants: [
    {
      id: `v-${Date.now()}-1`,
      sku: `TX-${Date.now().toString().slice(-4)}-FS`,
      barcode: '',
      size: 'Free Size',
      color: 'Classic Red',
      hex: '#b91c1c',
      price: 2199,
      mrp: 2999,
      priceOverride: false,
      mrpOverride: false,
    },
  ],
});

const toNonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const normalizeVariant = (variant, productPrice, productMrp, index) => {
  const priceOverride = variant.priceOverride === true;
  const mrpOverride = variant.mrpOverride === true;

  return {
    ...variant,
    id: variant.id || `variant-${Date.now()}-${index}`,
    sku: variant.sku || '',
    barcode: variant.barcode || '',
    size: variant.size || '',
    color: variant.color || '',
    hex: variant.hex || '#6366f1',
    priceOverride,
    mrpOverride,
    price: priceOverride
      ? toNonNegativeNumber(variant.price)
      : toNonNegativeNumber(productPrice),
    mrp: mrpOverride
      ? toNonNegativeNumber(variant.mrp)
      : toNonNegativeNumber(productMrp),
  };
};

export const ProductModal = ({ isOpen, onClose, productToEdit, onSave }) => {
  const isEditing = Boolean(productToEdit);
  const [formData, setFormData] = useState(createDefaultFormData);

  useEffect(() => {
    if (!isOpen) return;

    if (!productToEdit) {
      setFormData(createDefaultFormData());
      return;
    }

    const productPrice = toNonNegativeNumber(productToEdit.price);
    const productMrp = toNonNegativeNumber(productToEdit.mrp);

    setFormData({
      ...createDefaultFormData(),
      ...productToEdit,
      price: productPrice,
      mrp: productMrp,
      gstRate: productToEdit.gstRate ?? 5,
      variants: (productToEdit.variants || []).map((variant, index) =>
        normalizeVariant(variant, productPrice, productMrp, index),
      ),
    });
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const updateProductField = (field, value) => {
    setFormData((previous) => {
      const updated = { ...previous, [field]: value };

      if (field === 'price') {
        updated.variants = previous.variants.map((variant) =>
          variant.priceOverride
            ? variant
            : { ...variant, price: value },
        );
      }

      if (field === 'mrp') {
        updated.variants = previous.variants.map((variant) =>
          variant.mrpOverride
            ? variant
            : { ...variant, mrp: value },
        );
      }

      return updated;
    });
  };

  const handleAddVariant = () => {
    setFormData((previous) => {
      const suffix = Date.now().toString().slice(-5);
      const nextIndex = previous.variants.length + 1;

      return {
        ...previous,
        variants: [
          ...previous.variants,
          {
            id: `v-${Date.now()}-${nextIndex}`,
            sku: `TX-${suffix}-${nextIndex}`,
            barcode: '',
            size: 'M',
            color: '',
            hex: '#6366f1',
            price: toNonNegativeNumber(previous.price),
            mrp: toNonNegativeNumber(previous.mrp),
            priceOverride: false,
            mrpOverride: false,
          },
        ],
      };
    });
  };

  const updateVariant = (index, field, value) => {
    setFormData((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, [field]: value }
          : variant,
      ),
    }));
  };

  const toggleVariantOverride = (index, field, enabled) => {
    setFormData((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) => {
        if (variantIndex !== index) return variant;

        if (field === 'priceOverride') {
          return {
            ...variant,
            priceOverride: enabled,
            price: enabled
              ? toNonNegativeNumber(variant.price)
              : toNonNegativeNumber(previous.price),
          };
        }

        return {
          ...variant,
          mrpOverride: enabled,
          mrp: enabled
            ? toNonNegativeNumber(variant.mrp)
            : toNonNegativeNumber(previous.mrp),
        };
      }),
    }));
  };

  const handleRemoveVariant = (index) => {
    if (formData.variants.length <= 1) {
      window.alert('Product must have at least one variant.');
      return;
    }

    setFormData((previous) => ({
      ...previous,
      variants: previous.variants.filter(
        (_, variantIndex) => variantIndex !== index,
      ),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      window.alert('Product name is required.');
      return;
    }

    if (formData.variants.length === 0) {
      window.alert('Add at least one product variant.');
      return;
    }

    const productPrice = toNonNegativeNumber(formData.price);
    const productMrp = toNonNegativeNumber(formData.mrp);

    const payload = {
      ...formData,
      id: productToEdit?.id || `prod-${Date.now()}`,
      name: formData.name.trim(),
      price: productPrice,
      mrp: productMrp,
      gstRate: toNonNegativeNumber(formData.gstRate),
      variants: formData.variants.map((variant) => {
        const priceOverride = variant.priceOverride === true;
        const mrpOverride = variant.mrpOverride === true;

        return {
          ...variant,
          sku: String(variant.sku || '').trim(),
          barcode: String(variant.barcode || '').trim(),
          priceOverride,
          mrpOverride,
          price: priceOverride
            ? toNonNegativeNumber(variant.price)
            : productPrice,
          mrp: mrpOverride
            ? toNonNegativeNumber(variant.mrp)
            : productMrp,
        };
      }),
    };

    onSave(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product Catalogue Item' : 'Add New Textile Product'}
      subtitle="Configure pricing, GST rate, product details, and variants"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(event) =>
                updateProductField('name', event.target.value)
              }
              placeholder="e.g. Kanchipuram Pure Zari Silk Saree"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(event) =>
                updateProductField('category', event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              {mockCategories
                .filter((category) => category !== 'All')
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Fabric Type
            </label>
            <select
              value={formData.fabric}
              onChange={(event) =>
                updateProductField('fabric', event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              {mockFabrics.map((fabric) => (
                <option key={fabric} value={fabric}>
                  {fabric}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Brand / Weave House
            </label>
            <input
              type="text"
              value={formData.brand || ''}
              onChange={(event) =>
                updateProductField('brand', event.target.value)
              }
              placeholder="e.g. Ramraj, ChennaSilks"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              HSN / SAC Code
            </label>
            <input
              type="text"
              value={formData.hsn || ''}
              onChange={(event) =>
                updateProductField('hsn', event.target.value)
              }
              placeholder="e.g. 5007, 5208"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.price}
              onChange={(event) =>
                updateProductField('price', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-indigo-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              MRP (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.mrp}
              onChange={(event) =>
                updateProductField('mrp', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              GST Rate (%)
            </label>
            <select
              value={formData.gstRate}
              onChange={(event) =>
                updateProductField('gstRate', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold focus:border-indigo-500 focus:outline-none"
            >
              <option value="5">5% (Apparel &amp; Fabric &lt; ₹1,000)</option>
              <option value="12">12% (Apparel &gt; ₹1,000 / Home)</option>
              <option value="18">18% (Luxury &amp; Tailoring)</option>
              <option value="0">0% (Nil)</option>
            </select>
          </div>
        </div>

        <section className="border-t border-slate-200 pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Product Variants ({formData.variants.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Variants use the product price by default. Enable an override
                only when a variant has a different price.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variant
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {formData.variants.map((variant, index) => (
              <div
                key={variant.id || index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                      Size
                    </label>
                    <input
                      type="text"
                      value={variant.size || ''}
                      onChange={(event) =>
                        updateVariant(index, 'size', event.target.value)
                      }
                      placeholder="e.g. 40, Free Size"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                      Colour
                    </label>
                    <input
                      type="text"
                      value={variant.color || ''}
                      onChange={(event) =>
                        updateVariant(index, 'color', event.target.value)
                      }
                      placeholder="e.g. Royal Blue"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku || ''}
                      onChange={(event) =>
                        updateVariant(index, 'sku', event.target.value)
                      }
                      placeholder="SKU"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={variant.barcode || ''}
                      onChange={(event) =>
                        updateVariant(index, 'barcode', event.target.value)
                      }
                      placeholder="Scan or enter barcode"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={variant.priceOverride === true}
                        onChange={(event) =>
                          toggleVariantOverride(
                            index,
                            'priceOverride',
                            event.target.checked,
                          )
                        }
                      />
                      Use a different selling price for this variant
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={!variant.priceOverride}
                      value={
                        variant.priceOverride
                          ? variant.price
                          : formData.price
                      }
                      onChange={(event) =>
                        updateVariant(index, 'price', event.target.value)
                      }
                      aria-label={`Variant ${index + 1} selling price`}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={variant.mrpOverride === true}
                        onChange={(event) =>
                          toggleVariantOverride(
                            index,
                            'mrpOverride',
                            event.target.checked,
                          )
                        }
                      />
                      Use a different MRP for this variant
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={!variant.mrpOverride}
                      value={
                        variant.mrpOverride
                          ? variant.mrp
                          : formData.mrp
                      }
                      onChange={(event) =>
                        updateVariant(index, 'mrp', event.target.value)
                      }
                      aria-label={`Variant ${index + 1} MRP`}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    disabled={formData.variants.length <= 1}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Remove variant"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            {isEditing ? 'Save Product Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};