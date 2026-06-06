import React, { useState } from 'react';
import { Product, SaleParams } from '../types';

interface SellProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  activeDate: string;
  onSell: (params: SaleParams) => Promise<void>;
}

export default function SellProductModal({
  isOpen,
  onClose,
  product,
  activeDate,
  onSell,
}: SellProductModalProps) {
  const [price, setPrice] = useState('');
  const [paymentAsset, setPaymentAsset] = useState<'TRY' | 'USD' | 'EUR' | 'FINE_GOLD'>('TRY');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const prc = parseFloat(price);
    if (isNaN(prc) || prc <= 0) {
      setError('Lütfen geçerli bir satış fiyatı girin.');
      return;
    }

    setLoading(true);
    try {
      await onSell({
        product_id: product.id,
        vault_date: activeDate,
        price: prc,
        payment_asset: paymentAsset,
        customer_name: customerName.trim() || null,
        notes: notes.trim() || null,
      });

      // Reset state on success
      setPrice('');
      setCustomerName('');
      setNotes('');
      setPaymentAsset('TRY');
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Satış kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Ürün Satışı Yap
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

          {/* Product Summary Info */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1.5 text-xs text-zinc-300 font-medium">
            <div className="flex justify-between">
              <span className="text-zinc-500">Ürün Adı:</span>
              <span className="text-zinc-250 text-right">{product.name}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-zinc-500 font-sans">Barkod:</span>
              <span>{product.barcode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Özellikler:</span>
              <span>
                {product.weight_gram.toFixed(2)} gr brüt / {product.fine_gold_gram.toFixed(2)} gr Has ({product.karat}K)
              </span>
            </div>
          </div>

          {/* Price & Payment Asset */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-450 mb-1">Satış Fiyatı</label>
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-450 mb-1">Ödeme Türü</label>
              <select
                value={paymentAsset}
                onChange={(e: any) => setPaymentAsset(e.target.value)}
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

          {/* Customer Name */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1">Müşteri Adı (Opsiyonel)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Örn: Ahmet Yılmaz"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1">Notlar (Opsiyonel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Satışa özel notlar..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Footer Actions */}
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
              {loading ? 'Kaydediliyor...' : 'Satışı Tamamla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
