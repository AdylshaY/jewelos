import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';
import { AlertTriangle } from 'lucide-react';

interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: StockItem | null;
  activeDate: string;
  onUpdate: (
    stockItemId: number,
    weightGram: number,
    barcode: string,
    notes: string | null,
    vaultDate: string,
  ) => Promise<void>;
}

export default function EditStockModal({
  isOpen,
  onClose,
  stockItem,
  activeDate,
  onUpdate,
}: EditStockModalProps) {
  const [weight, setWeight] = useState('');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize internal state with selected stockItem
  useEffect(() => {
    if (stockItem) {
      setWeight(stockItem.weight_gram.toString());
      setBarcode(stockItem.barcode);
      setNotes(stockItem.notes || '');
      setError(null);
    }
  }, [stockItem, isOpen]);

  if (!isOpen || !stockItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      setError('Lütfen geçerli bir ağırlık (gram) girin.');
      return;
    }

    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) {
      setError('Barkod boş olamaz.');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(
        stockItem.id,
        w,
        trimmedBarcode,
        notes.trim() || null,
        activeDate,
      );
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Stok güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const hasWeightChanged = stockItem
    ? Math.abs(parseFloat(weight) - stockItem.weight_gram) > 0.0001
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Stok Kalemi Düzenle
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Product Name Display */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1 text-xs text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Ürün Tanımı:</span>
              <span className="text-zinc-250 font-semibold">{stockItem.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ayar:</span>
              <span className="text-zinc-250">{stockItem.karat}K</span>
            </div>
          </div>

          {/* Barcode & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-450 mb-1">Barkod</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Örn: JW-000001"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-450 mb-1">Ağırlık (gr)</label>
              <input
                type="number"
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>
          </div>

          {/* Warning Message if weight changes */}
          {hasWeightChanged && (
            <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-200/90 leading-normal">
                Ağırlık değişimi, kasa defterindeki envanter has altın değerini etkileyecektir. Bu değişiklik kasa raporlarında otomatik olarak <strong>Düzeltme (adjustment)</strong> işlemi olarak etiketlenecektir.
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1">Notlar (Opsiyonel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Düzeltme nedeni veya işçilik vb."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-750 transition-colors text-sm font-medium rounded-xl"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-colors text-sm font-medium rounded-xl disabled:opacity-50"
            >
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
