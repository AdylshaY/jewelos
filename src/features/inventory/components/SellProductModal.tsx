import React, { useState, useEffect } from 'react';
import { StockItem, SaleParams } from '../types';
import { useCRM } from '../../crm/hooks/useCRM';
import { ChevronDown } from 'lucide-react';

interface SellProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: StockItem | null;
  activeDate: string;
  onSell: (params: SaleParams) => Promise<void>;
}

export default function SellProductModal({
  isOpen,
  onClose,
  stockItem,
  activeDate,
  onSell,
}: SellProductModalProps) {
  const { customers, fetchCustomers } = useCRM();
  
  const [price, setPrice] = useState('');
  const [paymentAsset, setPaymentAsset] = useState<'TRY' | 'USD' | 'EUR' | 'FINE_GOLD'>('TRY');
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isOnCredit, setIsOnCredit] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      // Reset state on open
      setPrice('');
      setCustomerName('');
      setSelectedCustomerId(null);
      setIsOnCredit(false);
      setNotes('');
      setPaymentAsset('TRY');
      setError(null);
    }
  }, [isOpen, fetchCustomers]);

  if (!isOpen || !stockItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const prc = parseFloat(price);
    if (isNaN(prc) || prc <= 0) {
      setError('Lütfen geçerli bir satış fiyatı girin.');
      return;
    }

    if (isOnCredit && !selectedCustomerId) {
      setError('Veresiye satış yapabilmek için müşteri seçmelisiniz.');
      return;
    }

    setLoading(true);
    try {
      await onSell({
        stock_item_id: stockItem.id,
        vault_date: activeDate,
        price: prc,
        payment_asset: paymentAsset,
        customer_name: customerName.trim() || null,
        customer_id: selectedCustomerId,
        is_on_credit: selectedCustomerId ? isOnCredit : false,
        notes: notes.trim() || null,
      });

      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Satış kaydedilirken hata oluştu.');
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

          {/* Price & Payment */}
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
              <div className="relative">
                <select
                  value={paymentAsset}
                  onChange={(e: any) => setPaymentAsset(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                  required
                >
                  <option value="TRY">TRY (Türk Lirası)</option>
                  <option value="USD">USD (Dolar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="FINE_GOLD">FINE_GOLD (Has Altın)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1">Müşteri (Cari Kayıt)</label>
            <div className="relative">
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedCustomerId(val);
                  if (val) {
                    const cust = customers.find(c => c.id === val);
                    setCustomerName(cust ? cust.name : '');
                  } else {
                    setCustomerName('');
                    setIsOnCredit(false);
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
              >
                <option value="">-- Müşteri Seçilmedi (Perakende Satış) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* On Credit Toggle */}
          {selectedCustomerId && (
            <label className="flex items-center gap-2.5 p-3 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOnCredit}
                onChange={(e) => setIsOnCredit(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0"
              />
              <div className="text-[11px] text-zinc-300 font-medium leading-tight">
                <span>Veresiye / Cari Hesaba Borç Olarak Kaydet</span>
                <span className="block text-[9px] text-zinc-550 font-normal mt-0.5">
                  Ödeme günlük kasaya girmeyecek, müşterinin borç bakiyesini artıracaktır.
                </span>
              </div>
            </label>
          )}

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
              {loading ? 'Kaydediliyor...' : 'Satışı Tamamla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
