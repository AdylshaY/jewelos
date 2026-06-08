import { useState, useEffect, Fragment } from 'react';
import { StockItem } from '../types';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Tag,
  Pencil,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';

interface ProductGroup {
  product_id: number;
  product_name: string;
  category_code: string;
  karat: number;
  items: StockItem[];
  totalWeight: number;
  totalFineGold: number;
}

interface StockTableProps {
  stockItems: StockItem[];
  viewMode: 'grouped' | 'list';
  loading: boolean;
  showSoldDate: boolean;
  getPurityLabel: (karat: number) => string;
  translateCategory: (code: string) => string;
  onEdit: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
  onSell: (item: StockItem) => void;
  onReturn: (item: StockItem) => void;
}

export default function StockTable({
  stockItems,
  viewMode,
  loading,
  showSoldDate,
  getPurityLabel,
  translateCategory,
  onEdit,
  onDelete,
  onSell,
  onReturn,
}: StockTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());

  // Reset pagination when view mode or data length changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, stockItems.length]);

  // Generate product groups for grouped view
  const productGroups = Object.values(
    stockItems.reduce<Record<number, ProductGroup>>((acc, item) => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = {
          product_id: item.product_id,
          product_name: item.product_name,
          category_code: item.category_code,
          karat: item.karat,
          items: [],
          totalWeight: 0,
          totalFineGold: 0,
        };
      }
      acc[item.product_id].items.push(item);
      acc[item.product_id].totalWeight += item.weight_gram;
      acc[item.product_id].totalFineGold += item.fine_gold_gram;
      return acc;
    }, {})
  ).sort((a, b) => a.product_name.localeCompare(b.product_name));

  const totalCount = viewMode === 'list' ? stockItems.length : productGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Paginated slices
  const paginatedListItems = viewMode === 'list'
    ? stockItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  const paginatedGroupedItems = viewMode === 'grouped'
    ? productGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  const toggleProductExpand = (productId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getShowingText = () => {
    if (totalCount === 0) return 'Kayıt bulunamadı';
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return `${start} - ${end} / ${totalCount} ${viewMode === 'grouped' ? 'ürün grubu' : 'stok kalemi'} gösteriliyor`;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-500 font-medium">
        Veriler yükleniyor...
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="py-12 text-center text-zinc-500 font-medium border border-zinc-800/80 rounded-2xl bg-zinc-900/40">
        Kriterlere uygun envanter kalemi bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'list' ? (
            /* Flat List View */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-450">
                  <th className="py-2.5 font-medium">Barkod</th>
                  <th className="py-2.5 font-medium">Ürün Adı</th>
                  <th className="py-2.5 font-medium">Kategori</th>
                  <th className="py-2.5 font-medium">Ayar</th>
                  <th className="py-2.5 font-medium">Brüt Ağırlık</th>
                  <th className="py-2.5 font-medium">Has Altın</th>
                  {showSoldDate && <th className="py-2.5 font-medium">Satış Tarihi</th>}
                  <th className="py-2.5 font-medium text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
                {paginatedListItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-950/20 transition-colors">
                    <td className="py-3 font-mono font-bold text-zinc-200">{item.barcode}</td>
                    <td className="py-3 font-semibold text-zinc-200">{item.product_name}</td>
                    <td className="py-3 text-zinc-400">{translateCategory(item.category_code)}</td>
                    <td className="py-3 font-medium">{getPurityLabel(item.karat)}</td>
                    <td className="py-3 font-semibold">{item.weight_gram.toFixed(2)} gr</td>
                    <td className="py-3 font-bold text-amber-500">{item.fine_gold_gram.toFixed(2)} gr Has</td>
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
                              onClick={() => onEdit(item)}
                              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all rounded-lg"
                              title="Stok Kartını Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDelete(item)}
                              className="p-1 hover:bg-zinc-800 text-rose-400 hover:text-rose-350 transition-all rounded-lg"
                              title="Stok Kartını Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSell(item)}
                              className="px-2.5 py-1 bg-amber-650/15 hover:bg-amber-650/25 text-amber-500 border border-amber-650/15 transition-all rounded-lg font-semibold text-[10px]"
                            >
                              Satış Yap
                            </button>
                          </>
                        )}
                        {item.status === 'sold' && (
                          <button
                            onClick={() => onReturn(item)}
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
                ))}
              </tbody>
            </table>
          ) : (
            /* Grouped View */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-450">
                  <th className="py-2.5 w-10"></th>
                  <th className="py-2.5 font-medium">Ürün Grubu</th>
                  <th className="py-2.5 font-medium">Kategori</th>
                  <th className="py-2.5 font-medium">Ayar</th>
                  <th className="py-2.5 font-medium text-center">Stok Adedi</th>
                  <th className="py-2.5 font-medium">Toplam Brüt Ağırlık</th>
                  <th className="py-2.5 font-medium text-right">Toplam Has Altın</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
                {paginatedGroupedItems.map((group) => {
                  const isExpanded = expandedProductIds.has(group.product_id);
                  return (
                    <Fragment key={group.product_id}>
                      <tr
                        onClick={() => toggleProductExpand(group.product_id)}
                        className="hover:bg-zinc-950/20 cursor-pointer transition-colors"
                      >
                        <td className="py-3 text-center">
                          <button
                            onClick={(e) => toggleProductExpand(group.product_id, e)}
                            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 font-bold text-zinc-200">{group.product_name}</td>
                        <td className="py-3 text-zinc-400">{translateCategory(group.category_code)}</td>
                        <td className="py-3 font-semibold text-zinc-350">{getPurityLabel(group.karat)}</td>
                        <td className="py-3 text-center font-bold text-zinc-100">
                          <span className="px-2 py-0.5 bg-zinc-800 rounded-md text-xs font-semibold">
                            {group.items.length} adet
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-zinc-200">{group.totalWeight.toFixed(2)} gr</td>
                        <td className="py-3 font-bold text-amber-500 text-right">{group.totalFineGold.toFixed(2)} gr Has</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-zinc-950/30 border-b border-zinc-850">
                            <div className="px-6 py-4 space-y-3">
                              <div className="flex items-center gap-1.5 text-zinc-450 text-[10px] font-bold uppercase tracking-wider">
                                <Tag className="w-3.5 h-3.5 text-amber-500/80" /> Bireysel Kalemler ({group.items.length} Adet)
                              </div>
                              <div className="overflow-hidden border border-zinc-850 rounded-xl bg-zinc-950/50">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-zinc-850 text-zinc-500 bg-zinc-900/10">
                                      <th className="py-2 px-4 font-medium">Barkod</th>
                                      <th className="py-2 px-4 font-medium">Brüt Ağırlık</th>
                                      <th className="py-2 px-4 font-medium">Has Altın</th>
                                      {showSoldDate && <th className="py-2 px-4 font-medium">Satış Tarihi</th>}
                                      <th className="py-2 px-4 font-medium">Notlar</th>
                                      <th className="py-2 px-4 font-medium text-right">Aksiyonlar</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-850/30 text-zinc-300">
                                    {group.items.map((item) => (
                                      <tr key={item.id} className="hover:bg-zinc-900/20 transition-colors">
                                        <td className="py-2.5 px-4 font-mono font-bold text-zinc-200">{item.barcode}</td>
                                        <td className="py-2.5 px-4 font-semibold">{item.weight_gram.toFixed(2)} gr</td>
                                        <td className="py-2.5 px-4 font-bold text-amber-500/90">{item.fine_gold_gram.toFixed(2)} gr Has</td>
                                        {showSoldDate && (
                                          <td className="py-2.5 px-4 text-zinc-400 font-medium">
                                            {item.sold_date
                                              ? item.sold_date.split('-').reverse().join('.')
                                              : '—'}
                                          </td>
                                        )}
                                        <td className="py-2.5 px-4 text-zinc-450 italic truncate max-w-[150px]" title={item.notes || ''}>
                                          {item.notes || '—'}
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {item.status === 'in_stock' && (
                                              <>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all rounded-lg"
                                                  title="Stok Kartını Düzenle"
                                                >
                                                  <Pencil className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                                  className="p-1 hover:bg-zinc-800 text-rose-400 hover:text-rose-350 transition-all rounded-lg"
                                                  title="Stok Kartını Sil"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); onSell(item); }}
                                                  className="px-2 py-0.5 bg-amber-650/15 hover:bg-amber-650/25 text-amber-500 border border-amber-650/15 transition-all rounded-md font-semibold text-[10px]"
                                                >
                                                  Satış
                                                </button>
                                              </>
                                            )}
                                            {item.status === 'sold' && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); onReturn(item); }}
                                                className="px-2 py-0.5 bg-rose-650/15 hover:bg-rose-650/25 text-rose-455 border border-rose-650/15 transition-all rounded-md font-semibold text-[10px] flex items-center gap-1"
                                              >
                                                <ArrowLeftRight className="w-2.5 h-2.5" /> İade Al
                                              </button>
                                            )}
                                            {item.status === 'returned' && (
                                              <span className="text-[10px] text-zinc-550 font-semibold italic">Aksiyon Yok</span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
          <div className="text-zinc-450 text-xs font-semibold">
            {getShowingText()}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-zinc-450 text-xs font-semibold">
              <span>Satır:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700/60 transition-colors rounded-lg px-2 py-1 text-zinc-300 text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1.5 bg-zinc-950 border border-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-zinc-300 text-xs font-bold px-1 select-none">
                Sayfa {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-zinc-950 border border-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg flex items-center justify-center"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
