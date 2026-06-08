import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import AddStockModal from './AddStockModal';
import SellProductModal from './SellProductModal';
import CategoryModal from './CategoryModal';
import ProductCatalogModal from './ProductCatalogModal';
import EditStockModal from './EditStockModal';
import ReturnStockModal from './ReturnStockModal';
import { StockItem } from '../types';
import {
  Plus,
  Layers,
  Search,
  Tag,
  Coins,
  Award,
  ArrowLeftRight,
  BookOpen,
  Pencil,
  Trash2,
} from 'lucide-react';

interface ProductListProps {
  activeDate: string;
}

export default function ProductList({ activeDate }: ProductListProps) {
  const {
    products,
    stockItems,
    categories,
    filters,
    setFilters,
    loading,
    error,
    addProduct,
    updateProduct,
    addCategory,
    updateCategory,
    purchaseStock,
    sellStockItem,
    returnStockItem,
    updateStockItem,
    deleteStockItem,
    translateCategory,
    getPurityLabel,
  } = useInventory();

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedForSale, setSelectedForSale] = useState<StockItem | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<StockItem | null>(null);
  const [selectedForReturn, setSelectedForReturn] = useState<StockItem | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<StockItem | null>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedForDelete) return;
    try {
      await deleteStockItem(selectedForDelete.id, activeDate);
      setSelectedForDelete(null);
    } catch (err: any) {
      alert('Silme işlemi sırasında hata oluştu: ' + err.toString());
    }
  };

  // Stats for in-stock items
  const inStockItems = stockItems.filter((s) => s.status === 'in_stock');
  const totalWeight = inStockItems.reduce((sum, s) => sum + s.weight_gram, 0);
  const totalFineGold = inStockItems.reduce((sum, s) => sum + s.fine_gold_gram, 0);

  // Show sold_date column when viewing sold/all
  const showSoldDate = filters.status === 'sold' || filters.status === 'all';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" /> Ürün Envanter Defteri
          </h2>
          <p className="text-xs text-zinc-400">
            Ürün kataloğu, stok ekleme, satış, iade &bull; <span className="text-amber-500/90 font-semibold">Aktif Kasa: {activeDate.split('-').reverse().join('.')}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-zinc-500" /> Kategoriler
          </button>
          <button
            onClick={() => setIsCatalogModalOpen(true)}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-zinc-500" /> Ürün Kataloğu
          </button>
          <button
            onClick={() => setIsAddStockOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Stok Ekle
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-200 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <Tag className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Stoktaki Kalem</span>
            <span className="text-xl font-extrabold text-zinc-200">{inStockItems.length} adet</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <Coins className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Stok Toplam Brüt Ağırlık</span>
            <span className="text-xl font-extrabold text-zinc-200">{totalWeight.toFixed(2)} gr</span>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/15 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-amber-500/15 rounded-xl">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-amber-500/70 block font-semibold uppercase tracking-wider">Stok Toplam Has Altın</span>
            <span className="text-xl font-black text-amber-500">{totalFineGold.toFixed(2)} gr Has</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-zinc-950 border border-zinc-850 rounded-xl w-full sm:w-auto">
          {[
            { id: 'in_stock', label: 'Stoktakiler' },
            { id: 'sold', label: 'Satılanlar' },
            { id: 'returned', label: 'İadeler' },
            { id: 'all', label: 'Tümü' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilters((prev) => ({ ...prev, status: tab.id }))}
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

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <select
            value={filters.category_id || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : null }))}
            className="w-full sm:w-40 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-amber-500/50"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{translateCategory(cat.code)}</option>
            ))}
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Barkod veya ürün adı..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-zinc-250 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
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
                {showSoldDate && <th className="py-2.5 font-medium">Satış Tarihi</th>}
                <th className="py-2.5 font-medium text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={showSoldDate ? 9 : 8} className="py-8 text-center text-zinc-550">Yükleniyor...</td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={showSoldDate ? 9 : 8} className="py-8 text-center text-zinc-500 font-medium">
                    Kriterlere uygun stok kalemi bulunamadı.
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-950/20 transition-colors">
                    <td className="py-3 font-mono font-bold text-zinc-200">{item.barcode}</td>
                    <td className="py-3 font-semibold text-zinc-200">{item.product_name}</td>
                    <td className="py-3 text-zinc-400">{translateCategory(item.category_code)}</td>
                    <td className="py-3 font-medium">{getPurityLabel(item.karat)}</td>
                    <td className="py-3 font-semibold">{item.weight_gram.toFixed(2)} gr</td>
                    <td className="py-3 font-bold text-amber-500">{item.fine_gold_gram.toFixed(2)} gr Has</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === 'in_stock'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : item.status === 'sold'
                          ? 'bg-rose-500/10 text-rose-455'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {item.status === 'in_stock' ? 'Stokta' : item.status === 'sold' ? 'Satıldı' : 'İade'}
                      </span>
                    </td>
                    {showSoldDate && (
                      <td className="py-3 text-zinc-400 font-medium">
                        {item.sold_date
                          ? item.sold_date.split('-').reverse().join('.')
                          : '—'}
                      </td>
                    )}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'in_stock' && (
                          <>
                            <button
                              onClick={() => setSelectedForEdit(item)}
                              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all rounded-lg"
                              title="Stok Kartını Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedForDelete(item)}
                              className="p-1 hover:bg-zinc-800 text-rose-400 hover:text-rose-350 transition-all rounded-lg"
                              title="Stok Kartını Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedForSale(item)}
                              className="px-2.5 py-1 bg-amber-650/15 hover:bg-amber-650/25 text-amber-500 border border-amber-650/15 transition-all rounded-lg font-semibold text-[10px]"
                            >
                              Satış Yap
                            </button>
                          </>
                        )}
                        {item.status === 'sold' && (
                          <button
                            onClick={() => setSelectedForReturn(item)}
                            className="px-2.5 py-1 bg-rose-650/15 hover:bg-rose-650/25 text-rose-455 border border-rose-650/15 transition-all rounded-lg font-semibold text-[10px] flex items-center gap-1.5 ml-auto"
                          >
                            <ArrowLeftRight className="w-3 h-3" /> İade Al
                          </button>
                        )}
                        {item.status === 'returned' && (
                          <span className="text-[10px] text-zinc-550 font-semibold italic">Aksiyon Yok</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        products={products}
        categories={categories}
        activeDate={activeDate}
        onAddProduct={addProduct}
        onPurchaseStock={purchaseStock}
        translateCategory={translateCategory}
        getPurityLabel={getPurityLabel}
      />

      <SellProductModal
        isOpen={selectedForSale !== null}
        onClose={() => setSelectedForSale(null)}
        stockItem={selectedForSale}
        activeDate={activeDate}
        onSell={sellStockItem}
      />

      <EditStockModal
        isOpen={selectedForEdit !== null}
        onClose={() => setSelectedForEdit(null)}
        stockItem={selectedForEdit}
        activeDate={activeDate}
        onUpdate={updateStockItem}
      />

      <ReturnStockModal
        isOpen={selectedForReturn !== null}
        onClose={() => setSelectedForReturn(null)}
        stockItem={selectedForReturn}
        activeDate={activeDate}
        onReturn={returnStockItem}
      />

      {selectedForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Stok Kartını Sil
            </h3>
            <p className="text-sm text-zinc-300">
              <strong>{selectedForDelete.product_name}</strong> ({selectedForDelete.barcode}) ürününü envanterden tamamen silmek istediğinize emin misiniz?
            </p>
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-200">
              Not: Bu işlem ürünün envanter has değerini azaltacaktır. Kasadan yapılan ödeme kaydını düzeltmek için lütfen Günlük Kasa Defteri sekmesini kullanın.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForDelete(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-750 transition-colors text-xs font-semibold rounded-xl"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 transition-colors text-xs font-semibold text-white rounded-xl"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        translateCategory={translateCategory}
      />

      <ProductCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        products={products}
        onAddProduct={addProduct}
        onUpdateProduct={updateProduct}
        categories={categories}
        translateCategory={translateCategory}
        getPurityLabel={getPurityLabel}
      />
    </div>
  );
}
