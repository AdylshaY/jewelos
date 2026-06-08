import { useState } from 'react';
import { useDailyVault } from '../hooks/useDailyVault';
import OpenVaultModal from './OpenVaultModal';
import AddTransactionModal from './AddTransactionModal';
import CloseVaultModal from './CloseVaultModal';
import {
  Plus,
  Lock,
  Unlock,
  Calendar,
  RefreshCw,
  Coins,
  Award,
  DollarSign,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface VaultDashboardProps {
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
}

export default function VaultDashboard({ selectedDate: propSelectedDate, setSelectedDate: propSetSelectedDate }: VaultDashboardProps) {
  const {
    selectedDate,
    setSelectedDate,
    vaultStatus,
    summary,
    lastRates,
    loading,
    error,
    refresh,
    openVault,
    addTransaction,
    closeVault,
    formatCurrency,
    getAssetLabel,
    handlePrevDay,
    handleNextDay,
    handleGoToToday,
  } = useDailyVault(propSelectedDate, propSetSelectedDate);

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const handleCloseVault = async () => {
    await closeVault(selectedDate);
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'TRY':
        return <Coins className='w-5 h-5 text-zinc-400' />;
      case 'USD':
      case 'EUR':
        return <DollarSign className='w-5 h-5 text-zinc-450' />;
      case 'FINE_GOLD':
        return <Award className='w-5 h-5 text-amber-500' />;
      case 'PRODUCT':
        return <Layers className='w-5 h-5 text-yellow-600' />;
      default:
        return <Coins className='w-5 h-5 text-zinc-400' />;
    }
  };

  const getAssetColor = (assetType: string) => {
    switch (assetType) {
      case 'TRY':
        return 'border-l-zinc-650';
      case 'USD':
        return 'border-l-blue-650';
      case 'EUR':
        return 'border-l-indigo-650';
      case 'FINE_GOLD':
        return 'border-l-amber-500';
      case 'PRODUCT':
        return 'border-l-yellow-600';
      default:
        return 'border-l-zinc-700';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Top Header Controls */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl'>
            {vaultStatus?.status === 'open' ? (
              <Unlock className='w-5 h-5 text-emerald-400' />
            ) : (
              <Lock className='w-5 h-5 text-rose-400' />
            )}
          </div>
          <div>
            <h2 className='text-xl font-bold text-zinc-100'>
              Günlük Kasa Defteri
            </h2>
            <p className='text-xs text-zinc-400'>
              Günlük kasa durumunu, kurlarını ve nakit akışını izleyin
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* Go to Today Button */}
          <button
            onClick={handleGoToToday}
            className='px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-900/60 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors rounded-xl text-xs font-semibold cursor-pointer'
            title='Bugüne Git'
          >
            Bugün
          </button>

          {/* Prev Day Button */}
          <button
            onClick={handlePrevDay}
            className='p-2 bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-900/60 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors rounded-xl cursor-pointer'
            title='Önceki Gün'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>

          {/* Date Picker */}
          <div className='flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl'>
            <Calendar className='w-4 h-4 text-zinc-400' />
            <input
              type='date'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className='bg-transparent text-sm text-zinc-200 focus:outline-none cursor-pointer'
            />
          </div>

          {/* Next Day Button */}
          <button
            onClick={handleNextDay}
            className='p-2 bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-900/60 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors rounded-xl cursor-pointer'
            title='Sonraki Gün'
          >
            <ChevronRight className='w-4 h-4' />
          </button>

          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={loading}
            className='p-2 bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-900/60 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors rounded-xl disabled:opacity-50 cursor-pointer'
            title='Yenile'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className='p-4 bg-rose-950/40 border border-rose-900/60 text-rose-200 text-sm rounded-2xl'>
          {error}
        </div>
      )}

      {/* Main Content Areas */}
      {!vaultStatus ? (
        // Unopened/Closed Vault State
        <div className='flex flex-col items-center justify-center p-12 text-center bg-zinc-900/30 border border-zinc-800/70 border-dashed rounded-3xl min-h-[300px]'>
          <div className='p-4 bg-zinc-950 border border-zinc-850 rounded-2xl mb-4 text-zinc-450'>
            <Lock className='w-8 h-8 text-zinc-500' />
          </div>
          <h3 className='text-lg font-semibold text-zinc-200 mb-1'>
            {selectedDate} Tarihli Kasa Açılmamış
          </h3>
          <p className='text-sm text-zinc-450 max-w-sm mb-6'>
            Bu tarihte henüz gün sonu/kasa defteri başlatılmamış. İşlem
            yapabilmek için kasayı açmalısınız.
          </p>
          <button
            onClick={() => setIsOpenModalOpen(true)}
            className='px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2'
          >
            <Unlock className='w-4 h-4' /> Kasa Aç
          </button>
        </div>
      ) : (
        // Active Vault Dashboard
        <div className='space-y-6'>
          {/* Summary / Valuation Panel */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Total Value Card */}
            <div className='md:col-span-1 p-6 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px]'>
              <div>
                <span className='text-xs font-semibold text-amber-500/80 uppercase tracking-wider'>
                  Kasa Toplam Has Altın Değeri
                </span>
                <h3 className='text-3xl font-black text-amber-500 mt-2'>
                  {summary
                    ? formatCurrency(summary.total_fine_gold, 'FINE_GOLD')
                    : '0.00 g'}
                </h3>
              </div>
              <p className='text-[11px] text-zinc-400 mt-4 border-t border-amber-500/15 pt-2'>
                Nakit döviz ve altın varlıklarının güncel alış kurları üzerinden
                toplam altın karşılığı.
              </p>
            </div>

            {/* Exchange Rates Summary */}
            {summary?.rates && (
              <div className='md:col-span-2 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md flex flex-col justify-between'>
                <div>
                  <h4 className='text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3.5'>
                    Aktif Kurlar
                  </h4>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl'>
                      <span className='text-[10px] text-zinc-450 block font-medium'>
                        USD / TRY
                      </span>
                      <span className='text-sm font-semibold text-zinc-200 mt-1 block'>
                        Alış: {summary.rates.usd_buy}
                      </span>
                      <span className='text-xs text-zinc-400 block'>
                        Satış: {summary.rates.usd_sell}
                      </span>
                    </div>
                    <div className='bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl'>
                      <span className='text-[10px] text-zinc-450 block font-medium'>
                        EUR / TRY
                      </span>
                      <span className='text-sm font-semibold text-zinc-200 mt-1 block'>
                        Alış: {summary.rates.eur_buy}
                      </span>
                      <span className='text-xs text-zinc-400 block'>
                        Satış: {summary.rates.eur_sell}
                      </span>
                    </div>
                    <div className='bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl'>
                      <span className='text-[10px] text-zinc-450 block font-medium'>
                        ALTIN (24K)
                      </span>
                      <span className='text-sm font-semibold text-amber-500 mt-1 block'>
                        Alış: {summary.rates.gold_buy}
                      </span>
                      <span className='text-xs text-zinc-400 block'>
                        Satış: {summary.rates.gold_sell}
                      </span>
                    </div>
                  </div>
                </div>
                {vaultStatus.status === 'open' && (
                  <div className='flex justify-end mt-4'>
                    <button
                      onClick={() => setIsCloseModalOpen(true)}
                      className='px-4 py-1.5 bg-rose-650/10 hover:bg-rose-650/20 active:bg-rose-650/30 text-rose-400 border border-rose-650/20 hover:border-rose-650/30 transition-all rounded-lg text-xs font-semibold flex items-center gap-1.5'
                    >
                      <Lock className='w-3.5 h-3.5' /> Kasayı Kapat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Asset Balances Grid */}
          <div className='space-y-3'>
            <h3 className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
              Varlık Bakiyeleri
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4'>
              {summary?.balances.map((b) => (
                <div
                  key={b.asset_type}
                  className={`p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md border-l-4 ${getAssetColor(b.asset_type)} flex flex-col justify-between`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-[11px] font-semibold text-zinc-300'>
                      {getAssetLabel(b.asset_type)}
                    </span>
                    {getAssetIcon(b.asset_type)}
                  </div>
                  <div>
                    <span className='text-[10px] text-zinc-450 block'>
                      Açılış: {formatCurrency(b.opening_balance, b.asset_type)}
                    </span>
                    <span className='text-lg font-bold text-zinc-100 block mt-1'>
                      {formatCurrency(b.closing_balance, b.asset_type)}
                    </span>
                    {b.asset_type !== 'FINE_GOLD' &&
                      b.asset_type !== 'PRODUCT' && (
                        <span className='text-[10px] text-amber-500/80 block mt-0.5'>
                          ≈ {b.fine_gold_value.toFixed(2)} g Has
                        </span>
                      )}
                  </div>
                  <div className='flex items-center gap-2 mt-3 pt-2 border-t border-zinc-850/50 text-[9px] text-zinc-450'>
                    <span className='text-emerald-400 font-medium'>
                      Giriş: {formatCurrency(b.in_amount, b.asset_type)}
                    </span>
                    <span className='text-rose-400 font-medium'>
                      Çıkış: {formatCurrency(b.out_amount, b.asset_type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div className='p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold text-zinc-200'>
                Günün Kasa Hareketleri
              </h3>
              {vaultStatus.status === 'open' && (
                <button
                  onClick={() => setIsAddTxModalOpen(true)}
                  className='px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-all rounded-xl text-xs font-semibold flex items-center gap-1.5'
                >
                  <Plus className='w-3.5 h-3.5' /> İşlem Ekle
                </button>
              )}
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse text-xs'>
                <thead>
                  <tr className='border-b border-zinc-850 text-zinc-450'>
                    <th className='py-2.5 font-medium'>Varlık</th>
                    <th className='py-2.5 font-medium'>Yön</th>
                    <th className='py-2.5 font-medium'>Miktar</th>
                    <th className='py-2.5 font-medium'>Has Karşılığı</th>
                    <th className='py-2.5 font-medium'>Açıklama</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-zinc-850/50 text-zinc-300'>
                  {summary?.transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className='py-8 text-center text-zinc-500 font-medium'
                      >
                        Bugün henüz bir kasa hareketi eklenmemiş.
                      </td>
                    </tr>
                  ) : (
                    summary?.transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className='hover:bg-zinc-950/20 transition-colors'
                      >
                        <td className='py-3 font-semibold text-zinc-200'>
                          {getAssetLabel(tx.asset_type)}
                        </td>
                        <td className='py-3'>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              tx.direction === 'in'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {tx.direction === 'in' ? 'Giriş (+)' : 'Çıkış (-)'}
                          </span>
                        </td>
                        <td className='py-3 font-medium'>
                          {formatCurrency(tx.amount, tx.asset_type)}
                        </td>
                        <td className='py-3 font-semibold text-amber-500'>
                          {tx.fine_gold_gram.toFixed(2)} g
                        </td>
                        <td className='py-3 text-zinc-400'>
                          {tx.description || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals Wiring */}
      <OpenVaultModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onSubmit={(rates, balances) => openVault(selectedDate, rates, balances)}
        lastRates={lastRates}
        date={selectedDate}
      />

      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        onSubmit={addTransaction}
        formatCurrency={formatCurrency}
        getAssetLabel={getAssetLabel}
      />

      <CloseVaultModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSubmit={handleCloseVault}
        date={selectedDate}
      />
    </div>
  );
}
