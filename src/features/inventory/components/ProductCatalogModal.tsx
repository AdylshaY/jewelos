import React, { useState } from 'react';
import { Product, ProductCategory, NewProduct } from '../types';
import { BookOpen, Pencil, Check, X } from 'lucide-react';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: NewProduct) => Promise<number>;
  onUpdateProduct: (id: number, name: string, description: string | null) => Promise<void>;
  categories: ProductCategory[];
  translateCategory: (code: string) => string;
  getPurityLabel: (karat: number) => string;
}

export default function ProductCatalogModal({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  categories,
  translateCategory,
  getPurityLabel,
}: ProductCatalogModalProps) {
  // New product form
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newKarat, setNewKarat] = useState<number>(22);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (categories.length > 0 && !newCategoryId) {
      setNewCategoryId(categories[0].id.toString());
    }
  }, [categories, newCategoryId]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await onAddProduct({
        name: newName.trim(),
        category_id: parseInt(newCategoryId),
        karat: newKarat,
        description: null,
      });
      setNewName('');
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await onUpdateProduct(id, editName.trim(), null);
      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Ürün Kataloğu
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">{error}</div>
          )}

          {/* Add New Product */}
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-zinc-450 mb-1">Ürün Adı</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: 22 Ayar Burma Bilezik"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs text-zinc-450 mb-1">Kategori</label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{translateCategory(cat.code)}</option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs text-zinc-450 mb-1">Ayar</label>
              <select
                value={newKarat}
                onChange={(e) => setNewKarat(parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value={24}>24K</option>
                <option value={22}>22K</option>
                <option value={21}>21K</option>
                <option value={18}>18K</option>
                <option value={14}>14K</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white transition-colors rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Ekle
            </button>
          </form>

          {/* Product List */}
          <div className="border border-zinc-850 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-950 text-zinc-450 border-b border-zinc-850">
                  <th className="py-2.5 px-4 font-medium">Ürün Adı</th>
                  <th className="py-2.5 px-4 font-medium">Kategori</th>
                  <th className="py-2.5 px-4 font-medium">Ayar</th>
                  <th className="py-2.5 px-4 font-medium text-center">Stok</th>
                  <th className="py-2.5 px-4 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 font-medium">
                      Henüz ürün tanımlanmamış.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-950/20 transition-colors">
                      <td className="py-2.5 px-4 text-zinc-200 font-semibold">
                        {editingId === p.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-zinc-950 border border-amber-500/50 rounded-lg px-2 py-1 text-zinc-200 text-xs w-full focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          p.name
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400">{translateCategory(p.category_code)}</td>
                      <td className="py-2.5 px-4 text-zinc-300">{getPurityLabel(p.karat)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.stock_count > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {p.stock_count} adet
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {editingId === p.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleUpdate(p.id)}
                              disabled={loading}
                              className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-zinc-400 hover:text-zinc-300 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
