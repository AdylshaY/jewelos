import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import AddStockModal from './AddStockModal';
import SellProductModal from './SellProductModal';
import CategoryModal from './CategoryModal';
import ProductCatalogModal from './ProductCatalogModal';
import EditStockModal from './EditStockModal';
import ReturnStockModal from './ReturnStockModal';
import StockTable from './StockTable';
import PinVerificationModal from '../../../core/components/PinVerificationModal';
import { StockItem } from '../types';
import {
  Plus,
  Layers,
  Search,
  Tag,
  Coins,
  Award,
  BookOpen,
  ChevronDown,
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

  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedForSale, setSelectedForSale] = useState<StockItem | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<StockItem | null>(null);
  const [selectedForReturn, setSelectedForReturn] = useState<StockItem | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<StockItem | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const handleDeleteConfirm = () => {
    setIsPinModalOpen(true);
  };

  const handlePinSuccessForDelete = async () => {
    if (!selectedForDelete) return;
    try {
      await deleteStockItem(selectedForDelete.id, activeDate);
      setSelectedForDelete(null);
    } catch (err: any) {
      alert('Silme işlemi sırasında hata oluştu: ' + err.toString());
    }
  };

  // Dynamic stats calculation based on the active filter
  const totalWeight = stockItems.reduce((sum, s) => sum + s.weight_gram, 0);
  const totalFineGold = stockItems.reduce((sum, s) => sum + s.fine_gold_gram, 0);

  // Dynamic labels for stats card depending on the filter selection
  const getStatsLabels = () => {
    switch (filters.status) {
      case 'sold':
        return {
          count: 'Satılan Kalem',
          weight: 'Satılan Toplam Brüt Ağırlık',
          fineGold: 'Satılan Toplam Has Altın',
        };
      case 'returned':
        return {
          count: 'İade Alınan Kalem',
          weight: 'İade Toplam Brüt Ağırlık',
          fineGold: 'İade Toplam Has Altın',
        };
      case 'all':
        return {
          count: 'Toplam Kalem (Filtreli)',
          weight: 'Toplam Brüt Ağırlık (Filtreli)',
          fineGold: 'Toplam Has Altın (Filtreli)',
        };
      case 'in_stock':
      default:
        return {
          count: 'Stoktaki Kalem',
          weight: 'Stok Toplam Brüt Ağırlık',
          fineGold: 'Stok Toplam Has Altın',
        };
    }
  };

  const statsLabels = getStatsLabels();

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
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">{statsLabels.count}</span>
            <span className="text-xl font-extrabold text-zinc-200">{stockItems.length} Adet</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <Coins className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">{statsLabels.weight}</span>
            <span className="text-xl font-extrabold text-zinc-200">{totalWeight.toFixed(2)} gr</span>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/15 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-amber-500/15 rounded-xl">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-amber-500/70 block font-semibold uppercase tracking-wider">{statsLabels.fineGold}</span>
            <span className="text-xl font-black text-amber-500">{totalFineGold.toFixed(2)} gr Has</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950 border border-zinc-850 rounded-xl w-full sm:w-auto h-[30px]">
            {[
              { id: 'in_stock', label: 'Stoktakiler' },
              { id: 'sold', label: 'Satılanlar' },
              { id: 'returned', label: 'İadeler' },
              { id: 'all', label: 'Tümü' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilters((prev) => ({ ...prev, status: tab.id }))}
                className={`whitespace-nowrap px-3 text-xs font-semibold rounded-lg transition-all h-full flex items-center ${
                  filters.status === tab.id
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-500 hover:text-zinc-455'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950 border border-zinc-850 rounded-xl w-full sm:w-auto h-[30px]">
            <button
              onClick={() => setViewMode('grouped')}
              className={`whitespace-nowrap px-3 text-xs font-semibold rounded-lg transition-all h-full flex items-center ${
                viewMode === 'grouped'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-455'
              }`}
            >
              Grup Görünümü
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`whitespace-nowrap px-3 text-xs font-semibold rounded-lg transition-all h-full flex items-center ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-455'
              }`}
            >
              Tekil Liste
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          <div className="relative w-full sm:w-40 h-[30px]">
            <select
              value={filters.category_id || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : null }))}
              className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-9 text-zinc-300 text-xs focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{translateCategory(cat.code)}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-550 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative w-full sm:w-56 h-[30px]">
            <Search className="w-3.5 h-3.5 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2 animate-none" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Barkod veya ürün adı..."
              className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 text-zinc-250 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <StockTable
        stockItems={stockItems}
        viewMode={viewMode}
        loading={loading}
        showSoldDate={showSoldDate}
        getPurityLabel={getPurityLabel}
        translateCategory={translateCategory}
        onEdit={setSelectedForEdit}
        onDelete={setSelectedForDelete}
        onSell={setSelectedForSale}
        onReturn={setSelectedForReturn}
      />

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

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccessForDelete}
        actionTitle="Stok Kartı Silme"
      />
    </div>
  );
}
