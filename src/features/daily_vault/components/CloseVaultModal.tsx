import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface CloseVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
  date: string;
  balances: any[];
  formatCurrency: (amount: number, assetType: string) => string;
  getAssetLabel: (assetType: string) => string;
}

export default function CloseVaultModal({
  isOpen,
  onClose,
  onSubmit,
  date,
  balances,
  formatCurrency,
  getAssetLabel,
}: CloseVaultModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track physical count input values as strings
  const [actualCounts, setActualCounts] = useState<Record<string, string>>({});
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setExplanation('');
      
      // Initialize inputs with expected balances
      const initial: Record<string, string> = {};
      balances.forEach((b) => {
        initial[b.asset_type] = b.closing_balance.toString();
      });
      setActualCounts(initial);
    }
  }, [isOpen, balances]);

  if (!isOpen) return null;

  // Calculate discrepancies
  const reconciliationData = balances.map((b) => {
    const expected = b.closing_balance;
    const inputStr = actualCounts[b.asset_type] ?? '0';
    const actual = parseFloat(inputStr) || 0;
    const discrepancy = actual - expected;
    return {
      asset_type: b.asset_type,
      expected,
      actual,
      discrepancy,
    };
  });

  const hasDiscrepancy = reconciliationData.some((r) => Math.abs(r.discrepancy) > 0.0001);

  const handleInputChange = (assetType: string, val: string) => {
    setActualCounts((prev) => ({
      ...prev,
      [assetType]: val,
    }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (hasDiscrepancy && !explanation.trim()) {
      setError('Bakiye farkı bulunmaktadır. Lütfen bir kasa açığı/fazlası açıklaması girin.');
      setLoading(false);
      return;
    }

    try {
      // Structure the reconciliation JSON
      const payload = {
        type: 'reconciliation',
        actual: actualCounts,
        expected: balances.reduce((acc, b) => ({ ...acc, [b.asset_type]: b.closing_balance }), {}),
        discrepancies: reconciliationData.reduce((acc, r) => {
          if (Math.abs(r.discrepancy) > 0.0001) {
            acc[r.asset_type] = r.discrepancy;
          }
          return acc;
        }, {} as Record<string, number>),
        explanation: explanation.trim() || null,
        closed_at: new Date().toISOString(),
      };

      await onSubmit(JSON.stringify(payload));
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Kasa kapatılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Kasayı Kapat ve Mutabakat Yap ({date})
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-sm bg-rose-950/40 border border-rose-900/60 text-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <p className="text-xs text-zinc-400 leading-relaxed">
              Kasayı kapatmadan önce lütfen elinizdeki fiziki para ve has altın sayımını yapınız. Farklılık varsa sistem farkı raporlayacaktır.
            </p>

            {/* Reconciliation Table */}
            <div className="overflow-hidden border border-zinc-850 rounded-xl bg-zinc-950/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-450 bg-zinc-900/30">
                    <th className="py-2.5 px-4 font-medium">Varlık</th>
                    <th className="py-2.5 px-4 font-medium">Sistem Bakiyesi (Beklenen)</th>
                    <th className="py-2.5 px-4 font-medium w-40">Fiziki Sayım (Eldeki)</th>
                    <th className="py-2.5 px-4 font-medium text-right">Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40 text-zinc-300">
                  {reconciliationData.map((row) => (
                    <tr key={row.asset_type} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3 px-4 font-semibold">{getAssetLabel(row.asset_type)}</td>
                      <td className="py-3 px-4 text-zinc-400">{formatCurrency(row.expected, row.asset_type)}</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="any"
                          value={actualCounts[row.asset_type] ?? ''}
                          onChange={(e) => handleInputChange(row.asset_type, e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 font-bold"
                          required
                        />
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        row.discrepancy > 0.0001
                          ? 'text-emerald-400'
                          : row.discrepancy < -0.0001
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                      }`}>
                        {row.discrepancy > 0.0001 ? '+' : ''}
                        {formatCurrency(row.discrepancy, row.asset_type)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Discrepancy Warnings */}
            {hasDiscrepancy && (
              <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-3">
                <p className="text-xs text-amber-250 font-semibold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Uyarı: Fiziki sayım ile sistem bakiyesi arasında fark bulunmaktadır!
                </p>
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">Fark / Mutabakat Açıklaması (Zorunlu)</label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Örn: Gün sonu yuvarlama açığı / Nakit sayım hatası / Eksik ödeme..."
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>
              </div>
            )}

            <div className="p-3.5 bg-rose-950/10 border border-rose-900/20 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-rose-455 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-normal">
                ⚠️ <strong>Önemli Hatırlatma:</strong> Kasa kapatıldıktan sonra bu tarihe yeni kasa hareketleri, ürün alımları, satışlar veya iadeler eklenemez.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-900/30 border-t border-zinc-850 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition-colors text-sm font-medium rounded-xl border border-zinc-750"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-650 hover:bg-rose-600 active:bg-rose-700 text-white transition-colors text-sm font-semibold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Kasa Kapatılıyor...' : 'Mutabakatı Onayla ve Kapat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
