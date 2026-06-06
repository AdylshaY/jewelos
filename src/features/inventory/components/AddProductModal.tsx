import React, { useState } from 'react';
import { ProductCategory, NewProduct } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  activeDate: string;
  onPurchase: (
    vaultDate: string,
    product: NewProduct,
    payFromVault: boolean,
    vaultPrice: number | null,
    vaultAsset: string | null
  ) => Promise<void>;
  translateCategory: (code: string) => string;
  getPurityLabel: (karat: number) => string;
}

export default function AddProductModal({
  isOpen,
  onClose,
  categories,
  activeDate,
  onPurchase,
  translateCategory,
  getPurityLabel,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [karat, setKarat] = useState<number>(22);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  // Kasa ödeme entegrasyonu
  const [payFromVault, setPayFromVault] = useState(true);
  const [price, setPrice] = useState('');
  const [assetType, setAssetType] = useState<'TRY' | 'USD' | 'EUR' | 'FINE_GOLD'>('TRY');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default category when categories list loads
  React.useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id.toString());
    }
  }, [categories, categoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      setError('Lütfen geçerli bir ağırlık (gram) girin.');
      return;
    }

    const catId = parseInt(categoryId);
    if (isNaN(catId)) {
      setError('Lütfen geçerli bir kategori seçin.');
      return;
    }

    let pPrice: number | null = null;
    if (payFromVault) {
      pPrice = parseFloat(price);
      if (isNaN(pPrice) || pPrice <= 0) {
        setError('Kasadan ödeme seçiliyken tutar sıfırdan büyük olmalıdır.');
        return;
      }
    }

    setLoading(true);

    try {
      const product: NewProduct = {
        barcode: barcode.trim() || null,
        name: name.trim(),
        category_id: catId,
        karat,
        weight_gram: w,
        notes: notes.trim() || null,
      };

      await onPurchase(activeDate, product, payFromVault, pPrice, payFromVault ? assetType : null);
      
      // Reset state on success
      setName('');
      setBarcode('');
      setWeight('');
      setNotes('');
      setPrice('');
      setPayFromVault(true);
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Ürün kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Yeni Ürün Alışı / Ekleme
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
          {error && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Product Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-450 mb-1.5">Ürün Adı / Tanımı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: 22 Ayar Adana Burma Bilezik"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-450 mb-1.5">Barkod (Boş bırakılırsa oto-üretilir)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Örn: JW-000100"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-450 mb-1.5">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{translateCategory(cat.code)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-450 mb-1.5">Ayar (Karat)</label>
              <select
                value={karat}
                onChange={(e) => setKarat(parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              >
                <option value={24}>{getPurityLabel(24)}</option>
                <option value={22}>{getPurityLabel(22)}</option>
                <option value={21}>{getPurityLabel(21)}</option>
                <option value={18}>{getPurityLabel(18)}</option>
                <option value={14}>{getPurityLabel(14)}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-450 mb-1.5">Ağırlık (Gram)</label>
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

            <div className="col-span-2">
              <label className="block text-xs text-zinc-450 mb-1.5">Notlar</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="İşçilik detayları vb."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Cash Integration Box */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-250">Kasadan Ödeme Yap</span>
                <span className="text-[10px] text-zinc-500">Alış bedelini kasa nakit bakiyesinden düşer</span>
              </div>
              <input
                type="checkbox"
                checked={payFromVault}
                onChange={(e) => setPayFromVault(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-800 accent-amber-500"
              />
            </div>

            {payFromVault && (
              <div className="grid grid-cols-2 gap-3.5 animate-in slide-in-from-top-2 duration-150">
                <div>
                  <label className="block text-[11px] text-zinc-450 mb-1">Alış Fiyatı</label>
                  <input
                    type="number"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-450 mb-1">Kasa Döviz Türü</label>
                  <select
                    value={assetType}
                    onChange={(e: any) => setAssetType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                    required
                  >
                    <option value="TRY">TRY (Nakit TL)</option>
                    <option value="USD">USD (Dolar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="FINE_GOLD">FINE_GOLD (Has Altın)</option>
                  </select>
                </div>
              </div>
            )}
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
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-colors text-sm font-medium rounded-xl disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Alışı Tamamla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
