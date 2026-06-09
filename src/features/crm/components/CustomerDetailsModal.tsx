import React, { useState, useEffect } from 'react';
import { CustomerDetails, NewCustomerTransaction } from '../types';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  FileText,
  BadgeAlert,
  ChevronDown
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerDetails: CustomerDetails | null;
  activeDate: string;
  onAddTransaction: (tx: NewCustomerTransaction) => Promise<void>;
}

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  customerDetails,
  activeDate,
  onAddTransaction,
}: CustomerDetailsModalProps) {
  const [transactionType, setTransactionType] = useState<'payment' | 'deposit' | 'withdrawal' | 'adjustment'>('payment');
  const [direction, setDirection] = useState<'credit' | 'debt'>('credit');
  const [assetType, setAssetType] = useState<'TRY' | 'USD' | 'EUR' | 'FINE_GOLD'>('TRY');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [payFromVault, setPayFromVault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-set direction based on transaction type for easier UX
  useEffect(() => {
    if (transactionType === 'payment' || transactionType === 'deposit') {
      setDirection('credit');
    } else if (transactionType === 'withdrawal') {
      setDirection('debt');
    }
  }, [transactionType]);

  if (!isOpen || !customerDetails) return null;

  const { customer, transactions } = customerDetails;

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    setLoading(true);
    try {
      await onAddTransaction({
        customer_id: customer.id,
        vault_date: activeDate,
        transaction_type: transactionType,
        direction,
        asset_type: assetType,
        amount: amt,
        notes: notes.trim() || null,
        pay_from_vault: payFromVault,
      });

      // Reset transaction form
      setAmount('');
      setNotes('');
      setTransactionType('payment');
      setAssetType('TRY');
      setPayFromVault(true);
    } catch (err: any) {
      setError(err.toString() || 'Haraket kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getTxTypeLabel = (type: string) => {
    switch (type) {
      case 'sale_debt': return 'Ürün Satışı';
      case 'payment': return 'Ödeme / Tahsilat';
      case 'deposit': return 'Emanet Alımı';
      case 'withdrawal': return 'Emanet Teslimi';
      case 'adjustment': return 'Cari Düzeltme';
      default: return type;
    }
  };

  const formatAssetAmount = (amount: number, asset: string) => {
    if (asset === 'FINE_GOLD') {
      return `${amount.toFixed(2)} gr Has`;
    }
    const symbol = asset === 'TRY' ? '₺' : asset === 'USD' ? '$' : '€';
    return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              {customer.name} &bull; Cari Hesap Defteri
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">
              Aktif Kasa: {activeDate.split('-').reverse().join('.')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Grid: Info & Balances */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Card */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-850 pb-2">İletişim Bilgileri</h4>
              <div className="space-y-2.5 text-xs text-zinc-350">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{customer.phone || 'Telefon bulunmuyor'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{customer.email || 'E-posta bulunmuyor'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{customer.address || 'Adres bilgisi bulunmuyor'}</span>
                </div>
              </div>
              {customer.notes && (
                <div className="mt-3 pt-3 border-t border-zinc-850/60 text-xs text-zinc-450">
                  <span className="font-bold block text-zinc-400 mb-1">Müşteri Notu:</span>
                  {customer.notes}
                </div>
              )}
            </div>

            {/* Balances Card */}
            <div className="lg:col-span-2 p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-850 pb-2 mb-3">Hesap Bakiyeleri</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* TRY Balance */}
                  <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase">TRY Bakiye</span>
                    <span className={`text-sm font-extrabold font-mono block mt-1 ${customer.balance_try < 0 ? 'text-rose-500' : customer.balance_try > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                      {customer.balance_try < 0 ? '-' : customer.balance_try > 0 ? '+' : ''}{formatAssetAmount(Math.abs(customer.balance_try), 'TRY')}
                    </span>
                  </div>
                  {/* USD Balance */}
                  <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase">USD Bakiye</span>
                    <span className={`text-sm font-extrabold font-mono block mt-1 ${customer.balance_usd < 0 ? 'text-rose-500' : customer.balance_usd > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                      {customer.balance_usd < 0 ? '-' : customer.balance_usd > 0 ? '+' : ''}{formatAssetAmount(Math.abs(customer.balance_usd), 'USD')}
                    </span>
                  </div>
                  {/* EUR Balance */}
                  <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase">EUR Bakiye</span>
                    <span className={`text-sm font-extrabold font-mono block mt-1 ${customer.balance_eur < 0 ? 'text-rose-500' : customer.balance_eur > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                      {customer.balance_eur < 0 ? '-' : customer.balance_eur > 0 ? '+' : ''}{formatAssetAmount(Math.abs(customer.balance_eur), 'EUR')}
                    </span>
                  </div>
                  {/* Gold Balance */}
                  <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Emanet Altın</span>
                    <span className={`text-sm font-extrabold font-mono block mt-1 ${customer.balance_gold < 0 ? 'text-rose-500' : customer.balance_gold > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                      {customer.balance_gold < 0 ? '-' : customer.balance_gold > 0 ? '+' : ''}{customer.balance_gold.toFixed(2)} gr Has
                    </span>
                  </div>
                </div>
              </div>

              {/* Consolidated Gold */}
              <div className="mt-4 pt-4 border-t border-zinc-850/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-zinc-450 block font-semibold">Toplam Konsolide Bakiye (Has Altın Bazında)</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Altın kuru baz alınarak dövizler has altına dönüştürülmüştür.</p>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-mono text-base font-black flex items-center gap-1.5 ${
                  customer.balance_consolidated_gold < 0
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    : customer.balance_consolidated_gold > 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-450'
                }`}>
                  <Coins className="w-4 h-4" />
                  <span>
                    {customer.balance_consolidated_gold < 0 ? '-' : customer.balance_consolidated_gold > 0 ? '+' : ''}
                    {Math.abs(customer.balance_consolidated_gold).toFixed(2)} gr Has
                  </span>
                  <span className="text-xs font-sans font-bold">
                    {customer.balance_consolidated_gold < 0 ? '(Müşteri Borçlu)' : customer.balance_consolidated_gold > 0 ? '(Emaneti Var)' : '(Dengede)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Content Layout: Add Tx Form & Transactions List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Log Transaction Form */}
            <div className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-850 pb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-500" /> Hareket Ekle
              </h4>

              {error && (
                <div className="p-3 text-xs bg-red-950/40 border border-red-900/60 text-red-200 rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmitTx} className="space-y-4">
                {/* Tx Type */}
                <div>
                  <label className="block text-xs text-zinc-450 mb-1.5">İşlem Türü</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'payment', label: 'Tahsilat / Ödeme' },
                      { id: 'deposit', label: 'Emanet Alımı' },
                      { id: 'withdrawal', label: 'Emanet Teslimi' },
                      { id: 'adjustment', label: 'Cari Düzeltme' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTransactionType(t.id as any)}
                        className={`py-2 text-center text-xs font-semibold rounded-xl border transition-all ${
                          transactionType === t.id
                            ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/60'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direction (Only shown if adjustment, otherwise automated) */}
                {transactionType === 'adjustment' && (
                  <div>
                    <label className="block text-xs text-zinc-450 mb-1.5">Hesap Etkisi</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDirection('credit')}
                        className={`py-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                          direction === 'credit'
                            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        Emanet Ekle (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection('debt')}
                        className={`py-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                          direction === 'debt'
                            ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        Borç Ekle (-)
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount & Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-450 mb-1">Miktar / Tutar</label>
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-450 mb-1">Varlık Türü</label>
                    <div className="relative h-[38px]">
                      <select
                        value={assetType}
                        onChange={(e: any) => setAssetType(e.target.value)}
                        className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-9 text-zinc-300 text-xs focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                        required
                      >
                        <option value="TRY">TRY (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="FINE_GOLD">Altın (Has gr)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-550 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs text-zinc-450 mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="İşlem açıklaması..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Vault Integration Checkbox */}
                {transactionType !== 'adjustment' && (
                  <label className="flex items-center gap-2.5 p-2 bg-zinc-900 border border-zinc-850/60 rounded-xl cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={payFromVault}
                      onChange={(e) => setPayFromVault(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="text-[11px] text-zinc-350 font-medium leading-tight">
                      <span>Günlük Kasaya İşle (Entegre Et)</span>
                      <span className="block text-[9px] text-zinc-500 font-normal mt-0.5">
                        Kasa nakit/altın bakiyesini otomatik günceller.
                      </span>
                    </div>
                  </label>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {loading ? 'Kaydediliyor...' : 'Hareketi Kaydet'}
                </button>
              </form>
            </div>

            {/* Ledger History List */}
            <div className="lg:col-span-2 p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl flex flex-col min-h-[350px]">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-850 pb-2 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-500" /> Hesap Hareketleri Geçmişi
              </h4>

              <div className="overflow-x-auto flex-1">
                {transactions.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-zinc-550 gap-2 border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20">
                    <BadgeAlert className="w-6 h-6 text-zinc-650" />
                    <span className="text-xs font-semibold">Henüz hesap hareketi bulunmuyor.</span>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="text-zinc-500 font-semibold border-b border-zinc-850/60">
                        <th className="py-2.5">Tarih</th>
                        <th className="py-2.5">İşlem Türü</th>
                        <th className="py-2.5 text-right">Tutar</th>
                        <th className="py-2.5 text-right">Has Altın</th>
                        <th className="py-2.5 text-center">Hesap Etkisi</th>
                        <th className="py-2.5 pl-4">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/40">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="py-3 font-medium text-zinc-400 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                              {tx.vault_date.split('-').reverse().join('.')}
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-zinc-300">{getTxTypeLabel(tx.transaction_type)}</td>
                          <td className="py-3 text-right font-mono font-bold text-zinc-200">
                            {formatAssetAmount(tx.amount, tx.asset_type)}
                          </td>
                          <td className="py-3 text-right font-mono text-zinc-400">
                            {tx.fine_gold_gram.toFixed(2)}g
                          </td>
                          <td className="py-3 text-center whitespace-nowrap">
                            {tx.direction === 'credit' ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-bold text-[10px]">
                                <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Emanet / Ödeme (+)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/15 font-bold text-[10px]">
                                <ArrowUpRight className="w-3 h-3 text-rose-400" /> Borç (-)
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-zinc-450 pl-4 max-w-[200px] truncate" title={tx.notes || ''}>
                            {tx.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
