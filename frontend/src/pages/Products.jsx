
import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shirt
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockCategories, mockFabrics } from '../data/mockProducts';
import { ProductModal } from '../components/products/ProductModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCurrency } from '../utils/formatters';

export const Products = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFabric, setSelectedFabric] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'All' || p.category === selectedCategory;

      const matchesFab =
        selectedFabric === 'All' || p.fabric === selectedFabric;

      const q = searchQuery.toLowerCase().trim();

      if (!q) return matchesCat && matchesFab;

      const matchesName = (p.name || '').toLowerCase().includes(q);
      const matchesBrand = (p.brand || '').toLowerCase().includes(q);

      const matchesVariants = (p.variants || []).some(
        (v) => v.sku && v.sku.toLowerCase().includes(q)
      );

      return (
        matchesCat &&
        matchesFab &&
        (matchesName || matchesBrand || matchesVariants)
      );
    });
  }, [products, selectedCategory, selectedFabric, searchQuery]);

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData) => {
    if (productToEdit) {
      return await updateProduct(productToEdit.id, productData);
    }

    return await addProduct(productData);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidateId) return;

    try {
      await deleteProduct(deleteCandidateId);
      setDeleteCandidateId(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Products Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage billing inventory items, sizes, colours, and GST tax slabs
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          >
            {mockCategories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedFabric}
            onChange={(e) => setSelectedFabric(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="All">Fabric: All</option>

            {mockFabrics.map((fab) => (
              <option key={fab} value={fab}>
                {fab}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category & Fabric</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Variants</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">MRP</th>
                <th className="py-3 px-3 text-center">GST</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <Shirt className="w-10 h-10 text-slate-300 mx-auto mb-2" />

                    <p className="text-sm font-bold text-slate-700">
                      {products.length === 0
                        ? 'Your Catalogue is Clean & Empty'
                        : 'No matching products found'}
                    </p>

                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {products.length === 0
                        ? 'Register your silk sarees, shirts, and dhotis to begin issuing invoices.'
                        : 'Try searching with a different term or clear filters.'}
                    </p>

                    {products.length === 0 && (
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register First Product</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                      <div>{prod.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        HSN: {prod.hsn || '5007'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-indigo-700">
                        {prod.category}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {prod.fabric}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {prod.brand || '-'}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(prod.variants || []).slice(0, 3).map((v, index) => (
                          <span
                            key={v.id || index}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {v.size} {v.color ? `(${v.color})` : ''}
                          </span>
                        ))}

                        {(prod.variants || []).length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{prod.variants.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(prod.price)}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-400">
                      {prod.mrp ? formatCurrency(prod.mrp) : '-'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {prod.gstRate || 5}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteCandidateId(prod.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productToEdit={productToEdit}
          onSave={handleSaveProduct}
        />
      )}

      {deleteCandidateId && (
        <ConfirmDialog
          isOpen={Boolean(deleteCandidateId)}
          onClose={() => setDeleteCandidateId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Product"
          message="Are you sure you want to delete this product from the catalogue? Existing invoice records will not be altered."
          confirmText="Delete Product"
          isDestructive={true}
        />
      )}
    </div>
  );
};
