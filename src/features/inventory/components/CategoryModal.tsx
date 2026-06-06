import React, { useState } from 'react';
import { ProductCategory } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onAddCategory: (code: string, sortOrder: number) => Promise<void>;
  translateCategory: (code: string) => string;
}

export default function CategoryModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  translateCategory,
}: CategoryModalProps) {
  const [code, setCode] = useState('');
  const [sortOrder, setSortOrder] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                <label className="block text-[11px] text-zinc-450 mb-1">Kategori Adı (İngilizce Kod)</label>
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
                <label className="block text-[11px] text-zinc-450 mb-1">Sıralama</label>
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
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl divide-y divide-zinc-850/60 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="px-4 py-2.5 flex items-center justify-between text-sm text-zinc-300">
                  <span className="font-semibold text-zinc-200">{translateCategory(cat.code)}</span>
                  <span className="text-xs text-zinc-500">Sıra: {cat.sort_order} (Kod: {cat.code})</span>
                </div>
              ))}
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
