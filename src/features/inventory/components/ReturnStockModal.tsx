import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';

interface ReturnStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: StockItem | null;
  activeDate: string;
  onReturn: (
    stockItemId: number,
    vaultDate: string,
    refundAmount: number,
    refundAsset: string,
    notes: string | null,
  ) => Promise<void>;
}

export default function ReturnStockModal({
  isOpen,
  onClose,
  stockItem,
  activeDate,
  onReturn,
}: ReturnStockModalProps) {
  const [refundAmount, setRefundAmount] = useState('0');
  const [refundAsset, setRefundAsset] = useState<'TRY' | 'USD' | 'EUR' | 'FINE_GOLD'>('TRY');
  const [notes, setNotes] = useState('Müşteri İade Talebi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRefundAmount('0');
      setRefundAsset('TRY');
      setNotes('Müşteri İade Talebi');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !stockItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Lütfen geçerli bir iade tutarı girin.');
      return;
    }

    setLoading(true);
    try {
      await onReturn(
        stockItem.id,
        activeDate,
        amount,
        refundAsset,
        notes.trim() || null,
      );
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'İade kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            Ürün İade Al
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

          {/* Product Summary */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1.5 text-xs text-zinc-300 font-medium">
            <div className="flex justify-between">
              <span className="text-zinc-500">Ürün Adı:</span>
              <span className="text-zinc-250 text-right">{stockItem.product_name}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-zinc-500 font-sans">Barkod:</span>
              <span>{stockItem.barcode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Özellikler:</span>
              <span>
                {stockItem.weight_gram.toFixed(2)} gr brüt / {stockItem.fine_gold_gram.toFixed(2)} gr Has ({stockItem.karat}K)
              </span>
            </div>
          </div>

          {/* Refund Amount & Asset */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-450 mb-1">Geri Ödeme Tutarı</label>
              <input
                type="number"
                step="any"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-450 mb-1">Ödeme Yapılacak Kasa</label>
              <select
                value={refundAsset}
                onChange={(e: any) => setRefundAsset(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              >
                <option value="TRY">TRY (Türk Lirası)</option>
                <option value="USD">USD (Dolar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="FINE_GOLD">FINE_GOLD (Has Altın)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1">İade Notu</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="İade gerekçesi..."
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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white transition-colors text-sm font-medium rounded-xl disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'İade Al'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
