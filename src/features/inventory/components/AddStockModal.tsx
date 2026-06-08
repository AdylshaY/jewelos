import React, { useState } from 'react';
import { Product, ProductCategory, NewProduct, NewStockEntry } from '../types';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: ProductCategory[];
  activeDate: string;
  onAddProduct: (product: NewProduct) => Promise<number>;
  onPurchaseStock: (
    vaultDate: string,
    entry: NewStockEntry,
    payFromVault: boolean,
    vaultPrice: number | null,
    vaultAsset: string | null,
  ) => Promise<void>;
  translateCategory: (code: string) => string;
  getPurityLabel: (karat: number) => string;
}

export default function AddStockModal({
  isOpen,
  onClose,
  products,
  categories,
  activeDate,
  onAddProduct,
  onPurchaseStock,
  translateCategory,
  getPurityLabel,
}: AddStockModalProps) {
  // Product selection
  const [selectedProductId, setSelectedProductId] = useState<string>('new');

  // New product fields (when "new" is selected)
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newKarat, setNewKarat] = useState<number>(22);

  // Stock entry fields
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');

  // Vault payment
  const [payFromVault, setPayFromVault] = useState(true);
  const [price, setPrice] = useState('');
  const [assetType, setAssetType] = useState<'TRY' | 'USD' | 'EUR' | 'FINE_GOLD'>('TRY');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default category
  React.useEffect(() => {
    if (categories.length > 0 && !newCategoryId) {
      setNewCategoryId(categories[0].id.toString());
    }
  }, [categories, newCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      setError('Lütfen geçerli bir ağırlık (gram) girin.');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      setError('Adet en az 1 olmalıdır.');
      return;
    }

    let pPrice: number | null = null;
    if (payFromVault) {
      pPrice = parseFloat(price);
      if (isNaN(pPrice) || pPrice <= 0) {
        setError('Kasadan ödeme seçiliyken birim fiyat sıfırdan büyük olmalıdır.');
        return;
      }
    }

    setLoading(true);

    try {
      let productId: number;

      if (selectedProductId === 'new') {
        // Create new product first
        if (!newName.trim()) {
          setError('Ürün adı boş olamaz.');
          setLoading(false);
          return;
        }
        const catId = parseInt(newCategoryId);
        if (isNaN(catId)) {
          setError('Lütfen bir kategori seçin.');
          setLoading(false);
          return;
        }

        productId = await onAddProduct({
          name: newName.trim(),
          category_id: catId,
          karat: newKarat,
          description: null,
        });
      } else {
        productId = parseInt(selectedProductId);
      }

      const entry: NewStockEntry = {
        product_id: productId,
        weight_gram: w,
        barcode: barcode.trim() || null,
        quantity: qty,
        notes: notes.trim() || null,
      };

      await onPurchaseStock(activeDate, entry, payFromVault, pPrice, payFromVault ? assetType : null);

      // Reset
      setSelectedProductId('new');
      setNewName('');
      setWeight('');
      setQuantity('1');
      setBarcode('');
      setNotes('');
      setPrice('');
      setPayFromVault(true);
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Stok eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const isNewProduct = selectedProductId === 'new';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Stoğa Ürün Ekle
          </h3>
          <button onClick={onClose} disabled={loading} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">{error}</div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1.5">Ürün Seçimi</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option value="new">+ Yeni Ürün Tanımla</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {translateCategory(p.category_code)} / {p.karat}K (Stok: {p.stock_count})
                </option>
              ))}
            </select>
          </div>

          {/* New Product Fields */}
          {isNewProduct && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-950/50 border border-zinc-850 rounded-xl">
              <div className="col-span-2">
                <label className="block text-xs text-zinc-450 mb-1.5">Ürün Adı</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: 22 Ayar Burma Bilezik"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-450 mb-1.5">Kategori</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
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
                  value={newKarat}
                  onChange={(e) => setNewKarat(parseInt(e.target.value))}
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
            </div>
          )}

          {/* Stock Entry Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-450 mb-1.5">Ağırlık (gr)</label>
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
            <div>
              <label className="block text-xs text-zinc-450 mb-1.5">Adet</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-450 mb-1.5">Barkod (Opsiyonel)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Oto-üretilir"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-450 mb-1.5">Notlar</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="İşçilik detayları vb."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Vault Payment */}
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
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] text-zinc-450 mb-1">Birim Alış Fiyatı</label>
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

          {/* Footer */}
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
              {loading ? 'Kaydediliyor...' : 'Stok Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
