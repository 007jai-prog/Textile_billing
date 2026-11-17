import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, Plus, Minus, Tag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';

export const VariantPickerModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      setQuantity(1);
    }
  }, [product]);

  if (!product || !selectedVariant) return null;

  const handleAdd = () => {
    onAddToCart(selectedVariant, product, quantity);
    onClose();
  };

  // Unique sizes and colors available in product variants
  const sizes = Array.from(new Set(product.variants.map(v => v.size)));
  const colors = Array.from(new Set(product.variants.map(v => v.color)));

  const handleSizeClick = (size) => {
    const match = product.variants.find(
      v => v.size === size && (v.color === selectedVariant.color || true)
    );
    if (match) setSelectedVariant(match);
  };

  const handleColorClick = (color) => {
    const match = product.variants.find(
      v => v.color === color && (v.size === selectedVariant.size || true)
    );
    if (match) setSelectedVariant(match);
  };

  const currentPrice = selectedVariant.price || product.price;
  const currentMrp = selectedVariant.mrp || product.mrp;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`${product.category} • Fabric: ${product.fabric || 'Textile'}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Price & GST Header */}
        <div className="flex items-baseline justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(currentPrice)}</span>
            {currentMrp > currentPrice && (
              <span className="ml-2 text-xs text-slate-400 line-through">
                MRP {formatCurrency(currentMrp)}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
            GST {product.gstRate || 5}%
          </span>
        </div>

        {/* Sizes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Size
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => {
              const isSelected = selectedVariant.size === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeClick(size)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Colours */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Colour
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map(variant => {
              const isSelected = selectedVariant.id === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 border-indigo-600 ring-2 ring-indigo-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {variant.hex && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: variant.hex }}
                    />
                  )}
                  <span>{variant.color}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Variant Meta */}
        <div className="p-3 bg-slate-100/70 rounded-xl text-xs space-y-1 text-slate-600 font-mono">
          <div className="flex justify-between">
            <span className="flex items-center gap-1 text-slate-500"><Tag className="w-3.5 h-3.5" /> SKU:</span>
            <span className="font-semibold text-slate-800">{selectedVariant.sku}</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity</span>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 shadow-2xs font-bold"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-sm text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 shadow-2xs font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Add to Bill • {formatCurrency(currentPrice * quantity)}</span>
        </button>
      </div>
    </Modal>
  );
};
