import React, { useState, useEffect } from 'react';
import { ExchangeRatesSummary } from '../types';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';

interface SwapAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    fromAsset: string,
    toAsset: string,
    fromAmount: number,
    toAmount: number,
    notes?: string
  ) => Promise<void>;
  rates: ExchangeRatesSummary | null;
  getAssetLabel: (assetType: string) => string;
}

export default function SwapAssetsModal({
  isOpen,
  onClose,
  onSubmit,
  rates,
  getAssetLabel,
}: SwapAssetsModalProps) {
  const [fromAsset, setFromAsset] = useState<string>('TRY');
  const [toAsset, setToAsset] = useState<string>('USD');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFromAsset('TRY');
      setToAsset('USD');
      setFromAmount('');
      setToAmount('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateAutoConversion = (amountStr: string, from: string, to: string) => {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0 || !rates) return '';

    // Convert from "from" to TRY first, then from TRY to "to"
    let tryVal = 0;
    if (from === 'TRY') {
      tryVal = amt;
    } else if (from === 'USD') {
      tryVal = amt * rates.usd_buy; // Selling USD, get TRY at buy rate
    } else if (from === 'EUR') {
      tryVal = amt * rates.eur_buy; // Selling EUR, get TRY at buy rate
    } else if (from === 'FINE_GOLD' || from === 'PRODUCT') {
      tryVal = amt * rates.gold_buy; // Selling Gold, get TRY at gold buy rate
    }

    let finalVal = 0;
    if (to === 'TRY') {
      finalVal = tryVal;
    } else if (to === 'USD') {
      finalVal = tryVal / rates.usd_sell; // Buying USD, pay in TRY at sell rate
    } else if (to === 'EUR') {
      finalVal = tryVal / rates.eur_sell; // Buying EUR, pay in TRY at sell rate
    } else if (to === 'FINE_GOLD' || to === 'PRODUCT') {
      finalVal = tryVal / rates.gold_sell; // Buying Gold, pay in TRY at gold sell rate
    }

    return isNaN(finalVal) ? '' : finalVal.toFixed(4);
  };

  const handleFromAmountChange = (val: string) => {
    setFromAmount(val);
    const converted = calculateAutoConversion(val, fromAsset, toAsset);
    setToAmount(converted);
  };

  const handleFromAssetChange = (newFrom: string) => {
    setFromAsset(newFrom);
    // Auto shift target asset if it matches the source
    let newTo = toAsset;
    if (newFrom === toAsset) {
      newTo = newFrom === 'TRY' ? 'USD' : 'TRY';
      setToAsset(newTo);
    }
    const converted = calculateAutoConversion(fromAmount, newFrom, newTo);
    setToAmount(converted);
  };

  const handleToAssetChange = (newTo: string) => {
    setToAsset(newTo);
    // Auto shift source asset if it matches the target
    let newFrom = fromAsset;
    if (newTo === fromAsset) {
      newFrom = newTo === 'TRY' ? 'USD' : 'TRY';
      setFromAsset(newFrom);
    }
    const converted = calculateAutoConversion(fromAmount, newFrom, newTo);
    setToAmount(converted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fAmt = parseFloat(fromAmount);
    const tAmt = parseFloat(toAmount);

    if (isNaN(fAmt) || fAmt <= 0) {
      setError('Lütfen geçerli bir satılan varlık miktarı girin.');
      return;
    }
    if (isNaN(tAmt) || tAmt <= 0) {
      setError('Lütfen geçerli bir alınan varlık miktarı girin.');
      return;
    }
    if (fromAsset === toAsset) {
      setError('Aynı varlık türleri arasında takas yapılamaz.');
      return;
    }

    setLoading(true);
    try {
      const finalNotes = notes.trim()
        ? notes.trim()
        : `Takas: ${getAssetLabel(fromAsset)} -> ${getAssetLabel(toAsset)}`;

      await onSubmit(fromAsset, toAsset, fAmt, tAmt, finalNotes);
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Takas işlemi kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const assets = ['TRY', 'USD', 'EUR', 'FINE_GOLD', 'PRODUCT'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-500" />
            Hızlı Varlık Takası (Kasa Arbitrajı)
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!rates && (
            <div className="p-3 text-xs bg-amber-950/20 border border-amber-900/40 text-amber-200 rounded-lg">
              Not: Kur bilgileri bulunamadı. Otomatik takas dönüşümü çalışmayacaktır, miktarları manuel girmelisiniz.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Asset Section */}
            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Verilen/Çıkan Varlık</span>
              
              <div>
                <label className="block text-xs text-zinc-450 mb-1">Varlık Türü</label>
                <select
                  value={fromAsset}
                  onChange={(e) => handleFromAssetChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a} value={a}>{getAssetLabel(a)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-450 mb-1">Çıkan Miktar</label>
                <input
                  type="number"
                  step="any"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>

            {/* To Asset Section */}
            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Alınan/Giren Varlık</span>
              
              <div>
                <label className="block text-xs text-zinc-450 mb-1">Varlık Türü</label>
                <select
                  value={toAsset}
                  onChange={(e) => handleToAssetChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a} value={a}>{getAssetLabel(a)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-450 mb-1">Giren Miktar</label>
                <input
                  type="number"
                  step="any"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>
          </div>

          {/* Rates helper info */}
          {rates && fromAmount && (
            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Otomatik Kur Dönüşümü:</span>
                <span className="text-amber-500 font-semibold">Aktif</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                Dönüşüm günün aktif kur tablosundaki değerlere göre (alış/satış ayrımı gözetilerek) yapılmıştır. Gerektiğinde alınan miktarı manuel düzeltebilirsiniz.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs text-zinc-450 mb-1">Açıklama (İsteğe Bağlı)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Döviz Alımı (Kasa İçi)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-750 transition-colors text-sm font-medium rounded-xl border border-zinc-750"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-colors text-sm font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Takası Gerçekleştir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
