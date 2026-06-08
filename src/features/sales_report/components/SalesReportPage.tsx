import { useState, useEffect } from 'react';
import { useSalesReport } from '../hooks/useSalesReport';
import SalesCharts from './SalesCharts';
import {
  BarChart3,
  Calendar,
  Coins,
  Award,
  Tag,
  Search,
} from 'lucide-react';

export default function SalesReportPage() {
  const { report, loading, error, fetchReport, translateCategory, getPurityLabel } = useSalesReport();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch report on mount and when dates change
  useEffect(() => {
    fetchReport(dateFrom || undefined, dateTo || undefined);
  }, [fetchReport, dateFrom, dateTo]);

  // Filter entries by local search
  const filteredEntries = report?.entries.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.product_name.toLowerCase().includes(term) ||
      e.barcode.toLowerCase().includes(term) ||
      (e.counterparty && e.counterparty.toLowerCase().includes(term))
    );
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" /> Satış Raporları
          </h2>
          <p className="text-xs text-zinc-400">Tarih bazlı satış analizi, aylık istatistikler ve kategori dağılımı</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-amber-500/50"
            />
            <span className="text-zinc-500 text-xs">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-200 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <Tag className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Toplam Satış Adedi</span>
            <span className="text-xl font-extrabold text-zinc-200">{report?.total_count ?? 0} adet</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Toplam Ciro (TRY)</span>
            <span className="text-xl font-extrabold text-zinc-200">
              {(report?.total_price_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/15 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-amber-500/15 rounded-xl">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-amber-500/70 block font-semibold uppercase tracking-wider">Toplam Has Altın Satışı</span>
            <span className="text-xl font-black text-amber-500">
              {(report?.total_fine_gold ?? 0).toFixed(2)} gr Has
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {report && (report.monthly.length > 0 || report.by_category.length > 0) && (
        <SalesCharts
          monthly={report.monthly}
          byCategory={report.by_category}
          translateCategory={translateCategory}
        />
      )}

      {/* Sales Table */}
      <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-300">Satış Detayları</h3>
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün, barkod veya müşteri..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-zinc-250 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-850 text-zinc-450">
                <th className="py-2.5 font-medium">Tarih</th>
                <th className="py-2.5 font-medium">Ürün</th>
                <th className="py-2.5 font-medium">Barkod</th>
                <th className="py-2.5 font-medium">Kategori</th>
                <th className="py-2.5 font-medium">Ayar</th>
                <th className="py-2.5 font-medium">Ağırlık</th>
                <th className="py-2.5 font-medium">Has Altın</th>
                <th className="py-2.5 font-medium">Fiyat</th>
                <th className="py-2.5 font-medium">Müşteri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-550">Yükleniyor...</td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-medium">
                    {report?.total_count === 0 ? 'Henüz satış kaydı bulunmuyor.' : 'Arama kriterlerine uygun satış bulunamadı.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e, idx) => (
                  <tr key={idx} className="hover:bg-zinc-950/20 transition-colors">
                    <td className="py-3 text-zinc-400 font-medium">
                      {e.sale_date ? e.sale_date.split('-').reverse().join('.') : '—'}
                    </td>
                    <td className="py-3 font-semibold text-zinc-200">{e.product_name}</td>
                    <td className="py-3 font-mono text-zinc-300">{e.barcode}</td>
                    <td className="py-3 text-zinc-400">{translateCategory(e.category_code)}</td>
                    <td className="py-3">{getPurityLabel(e.karat)}</td>
                    <td className="py-3 font-semibold">{e.weight_gram.toFixed(2)} gr</td>
                    <td className="py-3 font-bold text-amber-500">{e.fine_gold_gram.toFixed(2)} gr</td>
                    <td className="py-3 font-semibold text-emerald-400">
                      {e.price_try.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {e.payment_asset || '₺'}
                    </td>
                    <td className="py-3 text-zinc-400">{e.counterparty || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
