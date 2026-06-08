import React, { useState } from 'react';
import { ProductCategory } from '../types';
import { Edit2, Check, X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onAddCategory: (code: string, sortOrder: number) => Promise<void>;
  onUpdateCategory: (id: number, code: string, sortOrder: number) => Promise<void>;
  translateCategory: (code: string) => string;
}

export default function CategoryModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  translateCategory,
}: CategoryModalProps) {
  const [code, setCode] = useState('');
  const [sortOrder, setSortOrder] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const codeTrimmed = code.trim();
    if (!codeTrimmed) {
      setError('Kategori ismi boş olamaz.');
      return;
    }

    const sort = parseInt(sortOrder);
    if (isNaN(sort)) {
      setError('Sıralama değeri sayı olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      await onAddCategory(codeTrimmed, sort);
      setCode('');
      setSortOrder('10');
    } catch (err: any) {
      setError(err.toString() || 'Kategori eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat: ProductCategory) => {
    setEditingCategoryId(cat.id);
    setEditCode(cat.code);
    setEditSortOrder(cat.sort_order.toString());
  };

  const handleEditSubmit = async (id: number) => {
    setError(null);
    const codeTrimmed = editCode.trim();
    if (!codeTrimmed) {
      setError('Kategori ismi boş olamaz.');
      return;
    }

    const sort = parseInt(editSortOrder);
    if (isNaN(sort)) {
      setError('Sıralama değeri sayı olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      await onUpdateCategory(id, codeTrimmed, sort);
      setEditingCategoryId(null);
    } catch (err: any) {
      setError(err.toString() || 'Kategori güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100">Kategori Yönetimi</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Add Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Yeni Kategori Ekle</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] text-zinc-455 mb-1">Kategori Adı (İngilizce Kod)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="E.g. watch, cufflinks"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-455 mb-1">Sıralama</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Ekleniyor...' : 'Kategori Ekle'}
            </button>
          </form>

          {/* List existing */}
          <div className="space-y-3 pt-4 border-t border-zinc-850">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Aktif Kategoriler</h4>
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl divide-y divide-zinc-850/60 max-h-56 overflow-y-auto">
              {categories.map((cat) => {
                const isEditing = editingCategoryId === cat.id;
                return (
                  <div key={cat.id} className="px-4 py-2.5 flex items-center justify-between text-sm text-zinc-300 min-h-[52px]">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full animate-in fade-in duration-100">
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                          placeholder="Category Code"
                          required
                        />
                        <input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(e.target.value)}
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                          placeholder="Sort"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleEditSubmit(cat.id)}
                          disabled={loading}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 rounded-md transition-colors"
                          title="Kaydet"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(null)}
                          disabled={loading}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 border border-zinc-750 rounded-md transition-colors"
                          title="Vazgeç"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-200">{translateCategory(cat.code)}</span>
                          <span className="text-[10px] text-zinc-500">Sıra: {cat.sort_order} &bull; Kod: {cat.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-850 hover:border-zinc-800 transition-colors rounded-lg flex items-center justify-center"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-850 flex justify-end bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition-colors text-sm font-medium rounded-xl"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

