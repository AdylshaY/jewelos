import { useState, useEffect } from 'react';
import { useVaultReport } from '../hooks/useVaultReport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  Filter,
} from 'lucide-react';

interface VaultReportTabProps {
  dateFrom: string;
  dateTo: string;
  theme: 'light' | 'dark';
}

const CATEGORY_COLORS = [
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#06b6d4', // cyan
];

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${months[parseInt(m) - 1]} ${year.slice(2)}`;
};

export default function VaultReportTab({ dateFrom, dateTo, theme }: VaultReportTabProps) {
  const {
    report,
    loading,
    error,
    fetchReport,
    translateCategory,
    getAssetLabel,
    formatCurrency,
  } = useVaultReport();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  useEffect(() => {
    fetchReport(dateFrom || undefined, dateTo || undefined);
  }, [fetchReport, dateFrom, dateTo]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#27272a' : '#e5e7eb';
  const tickColor = isDark ? '#71717a' : '#4b5563';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipBorder = isDark ? '#3f3f46' : '#e5e7eb';
  const tooltipLabelColor = isDark ? '#a1a1aa' : '#4b5563';
  const tooltipItemColor = isDark ? '#f4f4f5' : '#111827';
  const cursorFill = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';

  // Process data for charts
  const monthlyData = report?.monthly.map((m) => ({
    name: formatMonth(m.month),
    Giriş: parseFloat(m.total_in.toFixed(2)),
    Çıkış: parseFloat(m.total_out.toFixed(2)),
  })) ?? [];

  const expenseCategoriesData = report?.by_category
    .filter((c) => c.direction === 'out')
    .map((c) => ({
      name: translateCategory(c.category),
      value: parseFloat(c.fine_gold_gram.toFixed(2)),
      originalAmount: c.total_amount,
    })) ?? [];

  // Get unique categories for filter
  const uniqueCategories = Array.from(
    new Set(report?.entries.map((e) => e.category).filter(Boolean))
  ) as string[];

  // Filter entries locally
  const filteredEntries = report?.entries.filter((e) => {
    // Search Term match
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term.trim()
      ? true
      : (e.description && e.description.toLowerCase().includes(term)) ||
        getAssetLabel(e.asset_type).toLowerCase().includes(term) ||
        translateCategory(e.category).toLowerCase().includes(term);

    // Category Filter match
    const matchesCategory =
      selectedCategoryFilter === 'all'
        ? true
        : e.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  }) ?? [];

  const netFlow = (report?.total_in_gold ?? 0) - (report?.total_out_gold ?? 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-200 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Toplam Kasa Girişi (Altın Değeri)</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {(report?.total_in_gold ?? 0).toFixed(2)} gr Has
            </span>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Toplam Kasa Gideri (Altın Değeri)</span>
            <span className="text-xl font-extrabold text-rose-400">
              {(report?.total_out_gold ?? 0).toFixed(2)} gr Has
            </span>
          </div>
        </div>

        <div className={`p-4 border rounded-2xl flex items-center gap-4 transition-all ${
          netFlow >= 0 
            ? 'bg-emerald-500/5 border-emerald-500/15' 
            : 'bg-rose-500/5 border-rose-500/15'
        }`}>
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <Activity className={`w-5 h-5 ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Net Kasa Akışı</span>
            <span className={`text-xl font-black ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netFlow >= 0 ? '+' : ''}{netFlow.toFixed(2)} gr Has
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Bar Chart */}
        <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Aylık Giriş/Çıkış Dengesi</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-zinc-550">Yükleniyor...</div>
          ) : monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-zinc-500">Bu dönemde kasa hareketi bulunmuyor.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: tooltipLabelColor }}
                  itemStyle={{ color: tooltipItemColor }}
                  cursor={{ fill: cursorFill }}
                  formatter={(value: any) => [`${value} gr Has`, '']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: tooltipLabelColor, paddingTop: '10px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Giriş" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Çıkış" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Giderlerin Kategori Dağılımı</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-zinc-550">Yükleniyor...</div>
          ) : expenseCategoriesData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-zinc-500">Bu dönemde dükkan gideri bulunmuyor.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseCategoriesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {expenseCategoriesData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: tooltipLabelColor }}
                  itemStyle={{ color: tooltipItemColor }}
                  formatter={(value: any, name: any) => [`${value} gr Has`, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: tooltipLabelColor }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detail Table */}
      <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-zinc-300">Kasa İşlem Detayları</h3>
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Açıklama veya varlık ara..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-zinc-250 text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1">
              <Filter className="w-3.5 h-3.5 text-zinc-550" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-transparent text-zinc-300 text-xs focus:outline-none py-0.5"
              >
                <option value="all">Tüm Kategoriler</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {translateCategory(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-850 text-zinc-450">
                <th className="py-2.5 font-medium">Tarih</th>
                <th className="py-2.5 font-medium">Varlık</th>
                <th className="py-2.5 font-medium">Yön</th>
                <th className="py-2.5 font-medium">Kategori</th>
                <th className="py-2.5 font-medium">Miktar</th>
                <th className="py-2.5 font-medium">Has Karşılığı</th>
                <th className="py-2.5 font-medium">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-550">Yükleniyor...</td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-medium">
                    Kayıtlı kasa işlemi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-950/20 transition-colors">
                    <td className="py-3 text-zinc-400 font-medium">
                      {e.vault_date ? e.vault_date.split('-').reverse().join('.') : '—'}
                    </td>
                    <td className="py-3 font-semibold text-zinc-200">{getAssetLabel(e.asset_type)}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          e.direction === 'in'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {e.direction === 'in' ? 'Giriş (+)' : 'Çıkış (-)'}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-200 font-medium">
                      {translateCategory(e.category)}
                    </td>
                    <td className="py-3 font-semibold">
                      {formatCurrency(e.amount, e.asset_type)}
                    </td>
                    <td className="py-3 font-bold text-amber-500">{e.fine_gold_gram.toFixed(2)} gr</td>
                    <td className="py-3 text-zinc-400 max-w-xs truncate" title={e.description || ''}>
                      {e.description || '—'}
                    </td>
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
