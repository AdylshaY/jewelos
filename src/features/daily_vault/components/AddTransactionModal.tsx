import React, { useState } from 'react';
import { NewAssetEntry } from '../types';

const INFLOW_CATEGORIES = [
  { value: 'satis', label: 'Satış Geliri' },
  { value: 'ortak', label: 'Ortak Sermaye Girişi' },
  { value: 'diger_gelir', label: 'Diğer Gelir' }
];

const OUTFLOW_CATEGORIES = [
  { value: 'fatura', label: 'Fatura Ödemesi' },
  { value: 'yemek', label: 'Yemek Gideri' },
  { value: 'kira', label: 'Kira Ödemesi' },
  { value: 'maas', label: 'Personel Maaşı' },
  { value: 'avans', label: 'Personel Avansı' },
  { value: 'toptan', label: 'Toptancı Ödemesi' },
  { value: 'diger', label: 'Diğer Gider' }
];

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<NewAssetEntry, 'vault_date'>) => Promise<void>;
  formatCurrency: (amount: number, assetType: string) => string;
  getAssetLabel: (assetType: string) => string;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  getAssetLabel,
}: AddTransactionModalProps) {
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [category, setCategory] = useState<string>('satis');
  const [assetType, setAssetType] = useState<'TRY' | 'USD' | 'EUR' | 'FINE_GOLD' | 'PRODUCT'>('TRY');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDirectionChange = (dir: 'in' | 'out') => {
    setDirection(dir);
    setCategory(dir === 'in' ? 'satis' : 'fatura');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setValidationError('Lütfen geçerli ve pozitif bir miktar girin.');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        direction,
        asset_type: assetType,
        amount: amt,
        description: description.trim() || null,
        category,
      });
      // Reset state on success
      setAmount('');
      setDescription('');
      setDirection('in');
      setAssetType('TRY');
      setCategory('satis');
      onClose();
    } catch (err: any) {
      setValidationError(err.toString() || 'İşlem kaydedilirken bir hata oluştu.');
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
            Kasa İşlemi Ekle
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">
              {validationError}
            </div>
          )}

          {/* Direction Selection (Tabs) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-850 rounded-xl">
            <button
              type="button"
              onClick={() => handleDirectionChange('in')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                direction === 'in'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Kasaya Giriş (+)
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange('out')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                direction === 'out'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Kasadan Çıkış (-)
            </button>
          </div>

          {/* Asset Type */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1.5">Varlık Türü</label>
            <select
              value={assetType}
              onChange={(e: any) => setAssetType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option value="TRY">{getAssetLabel('TRY')}</option>
              <option value="USD">{getAssetLabel('USD')}</option>
              <option value="EUR">{getAssetLabel('EUR')}</option>
              <option value="FINE_GOLD">{getAssetLabel('FINE_GOLD')}</option>
              <option value="PRODUCT">{getAssetLabel('PRODUCT')}</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1.5">Kategori</label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            >
              {direction === 'in'
                ? INFLOW_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))
                : OUTFLOW_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1.5">Miktar</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 pr-16"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                {assetType === 'FINE_GOLD' || assetType === 'PRODUCT' ? 'Gram' : assetType}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1.5">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Toptancı ödemesi, Müşteri satışı vb."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
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
              className={`px-5 py-2 text-white transition-colors text-sm font-medium rounded-xl disabled:opacity-50 ${
                direction === 'in'
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
              }`}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
