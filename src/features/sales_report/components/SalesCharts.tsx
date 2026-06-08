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
import { MonthlySalesSummary, CategorySalesSummary } from '../types';

interface SalesChartsProps {
  monthly: MonthlySalesSummary[];
  byCategory: CategorySalesSummary[];
  translateCategory: (code: string) => string;
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

export default function SalesCharts({ monthly, byCategory, translateCategory }: SalesChartsProps) {
  const categoryData = byCategory.map((c) => ({
    name: translateCategory(c.category_code),
    value: c.count,
    fineGold: c.total_fine_gold,
  }));

  const monthlyData = monthly.map((m) => ({
    name: formatMonth(m.month),
    adet: m.count,
    hasAltin: parseFloat(m.total_fine_gold.toFixed(2)),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Monthly Bar Chart */}
      {monthlyData.length > 0 && (
        <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Aylık Satış Grafiği</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#f59e0b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#f4f4f5' }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#a1a1aa', paddingTop: '10px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar yAxisId="left" dataKey="adet" name="Satış Adedi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="hasAltin" name="Has Altın (gr)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Pie Chart */}
      {categoryData.length > 0 && (
        <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Kategori Dağılımı</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#f4f4f5' }}
                formatter={(value: any, name: any) => [`${value} adet`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
