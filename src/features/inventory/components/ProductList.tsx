import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import AddProductModal from './AddProductModal';
import SellProductModal from './SellProductModal';
import CategoryModal from './CategoryModal';
import { Product } from '../types';
import { 
  Plus, 
  Layers, 
  Search, 
  Tag, 
  Coins, 
  Award, 
  ArrowLeftRight 
} from 'lucide-react';

interface ProductListProps {
  activeDate: string;
}

export default function ProductList({ activeDate }: ProductListProps) {
  const {
    products,
    categories,
    filters,
    setFilters,
    loading,
    error,
    addCategory,
    updateCategory,
    purchaseProduct,
    sellProduct,
    returnProduct,
    translateCategory,
    getPurityLabel,
  } = useInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [selectedProductForSale, setSelectedProductForSale] = useState<Product | null>(null);

  const handleReturnProduct = async (product: Product) => {
    const refundStr = window.prompt(`"${product.name}" ürününün iadesi için müşteriye yapılacak geri ödeme tutarını girin (İptal için boş bırakın):`, '0');
    if (refundStr === null) return; // User cancelled prompt

    const refundAmount = parseFloat(refundStr);
    if (isNaN(refundAmount) || refundAmount < 0) {
      alert('Lütfen geçerli bir iade tutarı girin.');
      return;
    }

    try {
      await returnProduct(product.id, activeDate, refundAmount, 'TRY', 'Müşteri İade Talebi');
      alert('Ürün iadesi başarıyla işlendi ve kasa çıkışı yapıldı.');
    } catch (err: any) {
      alert('İade alınırken hata oluştu: ' + err.toString());
    }
  };

  // Stock Stats Calculations
  const inStockProducts = products.filter(p => p.status === 'in_stock');
  const totalWeight = inStockProducts.reduce((sum, p) => sum + p.weight_gram, 0);
  const totalFineGold = inStockProducts.reduce((sum, p) => sum + p.fine_gold_gram, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" /> Ürün Envanter Defteri
          </h2>
          <p className="text-xs text-zinc-400">Ürün alışı (stok ekleme), satışı, iadesi ve kategori yönetimini gerçekleştirin</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-zinc-500" /> Kategoriler
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Ürün Alışı (Stok Ekle)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-200 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-400">
            <Tag className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Stoktaki Ürün Sayısı</span>
            <span className="text-xl font-extrabold text-zinc-200">{inStockProducts.length} adet</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-400">
            <Coins className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Stok Toplam Brüt Ağırlık</span>
            <span className="text-xl font-extrabold text-zinc-200">{totalWeight.toFixed(2)} gr</span>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/15 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-amber-500/15 rounded-xl text-zinc-450">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-amber-500/70 block font-semibold uppercase tracking-wider">Stok Toplam Has Altın Değeri</span>
            <span className="text-xl font-black text-amber-500">{totalFineGold.toFixed(2)} gr Has</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-zinc-950 border border-zinc-850 rounded-xl w-full sm:w-auto">
          {[
            { id: 'in_stock', label: 'Stoktakiler' },
            { id: 'sold', label: 'Satılanlar' },
            { id: 'returned', label: 'İadeler' },
            { id: 'all', label: 'Tümü' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilters(prev => ({ ...prev, status: tab.id }))}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                filters.status === tab.id
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-455'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category & Search inputs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <select
            value={filters.category_id || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : null }))}
            className="w-full sm:w-40 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-amber-500/50"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{translateCategory(cat.code)}</option>
            ))}
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Barkod veya ürün adı..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-zinc-250 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-850 text-zinc-450">
                <th className="py-2.5 font-medium">Barkod</th>
                <th className="py-2.5 font-medium">Ürün Adı</th>
                <th className="py-2.5 font-medium">Kategori</th>
                <th className="py-2.5 font-medium">Ayar</th>
                <th className="py-2.5 font-medium">Brüt Ağırlık</th>
                <th className="py-2.5 font-medium">Has Altın</th>
                <th className="py-2.5 font-medium">Durum</th>
                <th className="py-2.5 font-medium text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-550">Yükleniyor...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 font-medium">
                    Kriterlere uygun ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-950/20 transition-colors">
                    <td className="py-3 font-mono font-bold text-zinc-200">{p.barcode}</td>
                    <td className="py-3 font-semibold text-zinc-200">{p.name}</td>
                    <td className="py-3 text-zinc-400">{translateCategory(p.category_code)}</td>
                    <td className="py-3 font-medium">{getPurityLabel(p.karat)}</td>
                    <td className="py-3 font-semibold">{p.weight_gram.toFixed(2)} gr</td>
                    <td className="py-3 font-bold text-amber-500">{p.fine_gold_gram.toFixed(2)} gr Has</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.status === 'in_stock'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : p.status === 'sold'
                          ? 'bg-rose-500/10 text-rose-455'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {p.status === 'in_stock' ? 'Stokta' : p.status === 'sold' ? 'Satıldı' : 'İade'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {p.status === 'in_stock' && (
                        <button
                          onClick={() => setSelectedProductForSale(p)}
                          className="px-2.5 py-1 bg-amber-650/15 hover:bg-amber-650/25 text-amber-500 border border-amber-650/15 transition-all rounded-lg font-semibold text-[10px]"
                        >
                          Satış Yap
                        </button>
                      )}
                      {p.status === 'sold' && (
                        <button
                          onClick={() => handleReturnProduct(p)}
                          className="px-2.5 py-1 bg-rose-650/15 hover:bg-rose-650/25 text-rose-455 border border-rose-650/15 transition-all rounded-lg font-semibold text-[10px] flex items-center gap-1.5 ml-auto"
                        >
                          <ArrowLeftRight className="w-3 h-3" /> İade Al
                        </button>
                      )}
                      {p.status === 'returned' && (
                        <span className="text-[10px] text-zinc-550 font-semibold italic">Aksiyon Yok</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        activeDate={activeDate}
        onPurchase={purchaseProduct}
        translateCategory={translateCategory}
        getPurityLabel={getPurityLabel}
      />

      <SellProductModal
        isOpen={selectedProductForSale !== null}
        onClose={() => setSelectedProductForSale(null)}
        product={selectedProductForSale}
        activeDate={activeDate}
        onSell={sellProduct}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        translateCategory={translateCategory}
      />
    </div>
  );
}
