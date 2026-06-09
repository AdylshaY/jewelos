import React, { useState, useEffect } from 'react';
import { NewExchangeRates, OpeningBalances, ExchangeRatesSummary } from '../types';

interface OpenVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rates: NewExchangeRates, balances: OpeningBalances | null) => Promise<void>;
  lastRates: ExchangeRatesSummary | null;
  fetchLiveRates: () => Promise<ExchangeRatesSummary>;
  date: string;
}

export default function OpenVaultModal({
  isOpen,
  onClose,
  onSubmit,
  lastRates,
  fetchLiveRates,
  date,
}: OpenVaultModalProps) {
  const [usdBuy, setUsdBuy] = useState('');
  const [usdSell, setUsdSell] = useState('');
  const [eurBuy, setEurBuy] = useState('');
  const [eurSell, setEurSell] = useState('');
  const [goldBuy, setGoldBuy] = useState('');
  const [goldSell, setGoldSell] = useState('');

  // Initial balances (only for the very first vault)
  const [showBalances, setShowBalances] = useState(false);
  const [tryBal, setTryBal] = useState('0');
  const [usdBal, setUsdBal] = useState('0');
  const [eurBal, setEurBal] = useState('0');
  const [goldBal, setGoldBal] = useState('0');
  const [productBal, setProductBal] = useState('0');

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [ratesSource, setRatesSource] = useState<'live' | 'fallback' | 'empty' | 'loading'>('empty');

  // Fetch live rates on modal open
  useEffect(() => {
    if (isOpen) {
      setRatesSource('loading');
      fetchLiveRates()
        .then((rates) => {
          setUsdBuy(rates.usd_buy.toString());
          setUsdSell(rates.usd_sell.toString());
          setEurBuy(rates.eur_buy.toString());
          setEurSell(rates.eur_sell.toString());
          setGoldBuy(rates.gold_buy.toString());
          setGoldSell(rates.gold_sell.toString());
          setRatesSource('live');
        })
        .catch((err) => {
          console.error('Failed to fetch live rates, using fallback:', err);
          if (lastRates) {
            setUsdBuy(lastRates.usd_buy.toString());
            setUsdSell(lastRates.usd_sell.toString());
            setEurBuy(lastRates.eur_buy.toString());
            setEurSell(lastRates.eur_sell.toString());
            setGoldBuy(lastRates.gold_buy.toString());
            setGoldSell(lastRates.gold_sell.toString());
            setRatesSource('fallback');
          } else {
            setUsdBuy('');
            setUsdSell('');
            setEurBuy('');
            setEurSell('');
            setGoldBuy('');
            setGoldSell('');
            setRatesSource('empty');
            setShowBalances(true); // First vault setup
          }
        });
    }
  }, [isOpen, lastRates]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const uBuy = parseFloat(usdBuy);
    const uSell = parseFloat(usdSell);
    const eBuy = parseFloat(eurBuy);
    const eSell = parseFloat(eurSell);
    const gBuy = parseFloat(goldBuy);
    const gSell = parseFloat(goldSell);

    if (
      isNaN(uBuy) || uBuy <= 0 ||
      isNaN(uSell) || uSell <= 0 ||
      isNaN(eBuy) || eBuy <= 0 ||
      isNaN(eSell) || eSell <= 0 ||
      isNaN(gBuy) || gBuy <= 0 ||
      isNaN(gSell) || gSell <= 0
    ) {
      setValidationError('Lütfen tüm döviz ve altın kurlarını geçerli ve pozitif sayılar olarak girin.');
      return;
    }

    setLoading(true);

    try {
      const rates: NewExchangeRates = {
        usd_buy: uBuy,
        usd_sell: uSell,
        eur_buy: eBuy,
        eur_sell: eSell,
        gold_buy: gBuy,
        gold_sell: gSell,
      };

      let balances: OpeningBalances | null = null;
      if (showBalances) {
        balances = {
          try_amount: parseFloat(tryBal) || 0,
          usd_amount: parseFloat(usdBal) || 0,
          eur_amount: parseFloat(eurBal) || 0,
          gold_amount: parseFloat(goldBal) || 0,
          product_amount: parseFloat(productBal) || 0,
        };
      }

      await onSubmit(rates, balances);
      onClose();
    } catch (err: any) {
      setValidationError(err.toString() || 'Kasa açılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const isFirstVault = !lastRates;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            Günlük Kasa Açılışı ({date})
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          {validationError && (
            <div className="p-3.5 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">
              {validationError}
            </div>
          )}

          {/* Rates Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Günlük Döviz & Altın Kurları (TRY)</h4>
              {ratesSource === 'loading' && (
                <span className="text-[10px] bg-zinc-800 text-zinc-450 px-2 py-0.5 rounded animate-pulse">Yükleniyor...</span>
              )}
              {ratesSource === 'live' && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">Canlı Kurlar</span>
              )}
              {ratesSource === 'fallback' && (
                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-medium">Kayıtlı Son Kurlar</span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">USD Alış</label>
                <input
                  type="number"
                  step="any"
                  value={usdBuy}
                  onChange={(e) => setUsdBuy(e.target.value)}
                  placeholder="32.50"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">USD Satış</label>
                <input
                  type="number"
                  step="any"
                  value={usdSell}
                  onChange={(e) => setUsdSell(e.target.value)}
                  placeholder="32.70"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">EUR Alış</label>
                <input
                  type="number"
                  step="any"
                  value={eurBuy}
                  onChange={(e) => setEurBuy(e.target.value)}
                  placeholder="35.10"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">EUR Satış</label>
                <input
                  type="number"
                  step="any"
                  value={eurSell}
                  onChange={(e) => setEurSell(e.target.value)}
                  placeholder="35.35"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">24K Altın Gr Alış</label>
                <input
                  type="number"
                  step="any"
                  value={goldBuy}
                  onChange={(e) => setGoldBuy(e.target.value)}
                  placeholder="2450"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">24K Altın Gr Satış</label>
                <input
                  type="number"
                  step="any"
                  value={goldSell}
                  onChange={(e) => setGoldSell(e.target.value)}
                  placeholder="2470"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* First Opening Balances Setup */}
          {isFirstVault && (
            <div className="space-y-4 border-t border-zinc-850 pt-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">İlk Açılış Bakiyeleri</h4>
                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-medium">Sistemde İlk Kasa</span>
              </div>
              <p className="text-[11px] text-zinc-400 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-850">
                Sistemdeki ilk günlük kasa açılışını yaptığınız için elinizdeki mevcut nakit ve has altın envanter bakiyesini girmelisiniz.
              </p>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-zinc-450 mb-1">Nakit TRY</label>
                  <input
                    type="number"
                    step="any"
                    value={tryBal}
                    onChange={(e) => setTryBal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-450 mb-1">Nakit USD</label>
                  <input
                    type="number"
                    step="any"
                    value={usdBal}
                    onChange={(e) => setUsdBal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-450 mb-1">Nakit EUR</label>
                  <input
                    type="number"
                    step="any"
                    value={eurBal}
                    onChange={(e) => setEurBal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-450 mb-1">Has Altın (gr)</label>
                  <input
                    type="number"
                    step="any"
                    value={goldBal}
                    onChange={(e) => setGoldBal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-450 mb-1">Mevcut Ürün Stok Değeri (Has Altın gr eşdeğeri)</label>
                  <input
                    type="number"
                    step="any"
                    value={productBal}
                    onChange={(e) => setProductBal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
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
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-colors text-sm font-medium rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Kasa Açılıyor...' : 'Kasayı Aç'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
