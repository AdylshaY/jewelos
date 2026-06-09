import { useState, useEffect } from 'react';
import { useCRM } from '../hooks/useCRM';
import CustomerModal from './CustomerModal';
import CustomerDetailsModal from './CustomerDetailsModal';
import PinVerificationModal from '../../../core/components/PinVerificationModal';
import { Customer } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Eye, 
  Edit2, 
  Trash2,
  TrendingDown,
  TrendingUp,
  Scale
} from 'lucide-react';

interface CRMPageProps {
  activeDate: string;
}

export default function CRMPage({ activeDate }: CRMPageProps) {
  const {
    customers,
    activeCustomerDetails,
    loading,
    error,
    fetchCustomers,
    fetchCustomerDetails,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerTransaction,
  } = useCRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Customer | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Fetch customer list initially
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreateOrUpdate = async (customerData: any) => {
    if (selectedCustomer) {
      await updateCustomer(selectedCustomer.id, customerData);
    } else {
      await addCustomer(customerData);
    }
    setSelectedCustomer(null);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setIsAddEditOpen(true);
  };

  const handleOpenDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    try {
      await fetchCustomerDetails(customer.id);
      setIsDetailsOpen(true);
    } catch (err) {
      alert('Müşteri cari detayları yüklenemedi.');
    }
  };

  const handleOpenDelete = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForDelete(customer);
    setIsPinModalOpen(true);
  };

  const handlePinSuccessForDelete = async () => {
    if (!selectedForDelete) return;
    try {
      await deleteCustomer(selectedForDelete.id);
      setSelectedForDelete(null);
    } catch (err: any) {
      alert('Müşteri kaydı silinirken hata oluştu: ' + err.toString());
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  // Aggregated CRM stats
  const totalCustomers = customers.length;
  
  // Total gold debts: sum of all negative consolidated balances
  const totalGoldDebts = customers.reduce((sum, c) => 
    c.balance_consolidated_gold < 0 ? sum + Math.abs(c.balance_consolidated_gold) : sum, 0
  );

  // Total gold deposits: sum of all positive consolidated balances
  const totalGoldDeposits = customers.reduce((sum, c) => 
    c.balance_consolidated_gold > 0 ? sum + c.balance_consolidated_gold : sum, 0
  );

  const getConsolidatedBalanceLabel = (val: number) => {
    if (val < 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/15 font-bold font-mono">
          <TrendingDown className="w-3.5 h-3.5" />
          -{Math.abs(val).toFixed(2)} gr Has
        </span>
      );
    } else if (val > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 font-bold font-mono">
          <TrendingUp className="w-3.5 h-3.5" />
          +{val.toFixed(2)} gr Has
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-900 text-zinc-450 border border-zinc-800 font-bold font-mono">
          <Scale className="w-3.5 h-3.5 text-zinc-650" />
          0.00 gr
        </span>
      );
    }
  };

  const getIndividualBalanceText = (val: number, asset: string) => {
    if (val === 0) return null;
    const symbol = asset === 'TRY' ? '₺' : asset === 'USD' ? '$' : asset === 'EUR' ? '€' : 'gr Has';
    const isGold = asset === 'FINE_GOLD';
    const valText = isGold ? val.toFixed(2) : val.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    
    return (
      <span key={asset} className={`whitespace-nowrap px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-850/50 text-[10px] font-mono font-semibold ${
        val < 0 ? 'text-rose-500/90' : 'text-emerald-500/90'
      }`}>
        {val > 0 ? '+' : ''}{valText}{!isGold ? symbol : ` ${symbol}`}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" /> Müşteri İlişkileri Yönetimi (CRM)
          </h2>
          <p className="text-xs text-zinc-400">
            Müşteri cari hesap kayıtları, emanet takibi, borç ve ödeme işlemleri &bull; <span className="text-amber-500/90 font-semibold">Aktif Kasa: {activeDate.split('-').reverse().join('.')}</span>
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCustomer(null);
            setIsAddEditOpen(true);
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" /> Müşteri Ekle
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-200 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Count Card */}
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <Users className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Kayıtlı Müşteri</span>
            <span className="text-xl font-extrabold text-zinc-200">{totalCustomers} Kişi</span>
          </div>
        </div>

        {/* Debts Card */}
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-rose-500/10 rounded-xl">
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Toplam Müşteri Alacağı (Mağazanın)</span>
            <span className="text-xl font-extrabold text-rose-500">{totalGoldDebts.toFixed(2)} gr Has</span>
          </div>
        </div>

        {/* Deposits Card */}
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-emerald-500/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-550 block font-semibold uppercase tracking-wider">Toplam Müşteri Emaneti (Mağadaki)</span>
            <span className="text-xl font-extrabold text-emerald-500">{totalGoldDeposits.toFixed(2)} gr Has</span>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md flex items-center justify-between">
        <div className="relative w-full sm:w-80 h-[32px]">
          <Search className="w-4 h-4 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Müşteri adı veya telefon numarası..."
            className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 text-zinc-250 text-xs focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          {loading && customers.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs font-semibold">Veriler yükleniyor...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs font-semibold">Kayıtlı müşteri bulunamadı.</div>
          ) : (
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-zinc-900/55 text-zinc-400 font-semibold border-b border-zinc-850/60 uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Müşteri Adı</th>
                  <th className="px-6 py-4">İletişim</th>
                  <th className="px-6 py-4">Para/Altın Detay</th>
                  <th className="px-6 py-4 text-center">Net Cari Durum (Has Altın)</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/50">
                {filteredCustomers.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => handleOpenDetails(c)}
                    className="hover:bg-zinc-800/20 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-200 text-sm">{c.name}</div>
                      {c.notes && <div className="text-[10px] text-zinc-500 truncate max-w-[200px] mt-0.5">{c.notes}</div>}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-650" />
                        <span>{c.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                        {[
                          getIndividualBalanceText(c.balance_try, 'TRY'),
                          getIndividualBalanceText(c.balance_usd, 'USD'),
                          getIndividualBalanceText(c.balance_eur, 'EUR'),
                          getIndividualBalanceText(c.balance_gold, 'FINE_GOLD')
                        ].filter(Boolean)}
                        {c.balance_try === 0 && c.balance_usd === 0 && c.balance_eur === 0 && c.balance_gold === 0 && (
                          <span className="text-[10px] text-zinc-550 italic font-semibold">Aktif hareket yok</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getConsolidatedBalanceLabel(c.balance_consolidated_gold)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(c);
                          }}
                          title="Cari Defteri Aç"
                          className="p-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 rounded-xl transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEdit(c, e)}
                          title="Düzenle"
                          className="p-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 rounded-xl transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenDelete(c, e)}
                          title="Sil"
                          className="p-2 bg-zinc-950 border border-zinc-850 hover:border-rose-900/60 hover:text-rose-400 text-zinc-500 rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSubmit={handleCreateOrUpdate}
      />

      <CustomerDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedCustomer(null);
        }}
        customerDetails={activeCustomerDetails}
        activeDate={activeDate}
        onAddTransaction={addCustomerTransaction}
      />

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccessForDelete}
        actionTitle="Müşteri Kaydını Silme"
      />
    </div>
  );
}
