import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import RestoreConfirmModal from './RestoreConfirmModal';
import PinSettingsCard from './PinSettingsCard';
import PinVerificationModal from '../../../core/components/PinVerificationModal';
import {
  Database,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Sun,
  Moon,
  Coins,
} from 'lucide-react';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function SettingsPage({ theme, setTheme }: SettingsPageProps) {
  const {
    backupLoading,
    restoreLoading,
    resetLoading,
    pinLoading,
    isPinSet,
    successMessage,
    errorMessage,
    clearMessages,
    handleBackup,
    handleRestore,
    handleResetDatabase,
    handleSetPin,
    handleRemovePin,
    rateProvider,
    rateApiKey,
    handleSaveRateSettings,
  } = useSettings();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const isLoading = backupLoading || restoreLoading || resetLoading;

  const [provider, setProvider] = useState(rateProvider || 'tcmb');
  const [apiKey, setApiKey] = useState(rateApiKey || '');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (rateProvider) setProvider(rateProvider);
  }, [rateProvider]);

  useEffect(() => {
    if (rateApiKey) setApiKey(rateApiKey);
  }, [rateApiKey]);

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await handleSaveRateSettings(provider, apiKey);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Top Header Controls */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl'>
            <Settings className='w-5 h-5 text-amber-500' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-zinc-100'>Sistem Ayarları</h2>
            <p className='text-xs text-zinc-400'>
              Sistem yedekleme, geri yükleme ve genel ayarları yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className='p-4 bg-emerald-950/40 border border-emerald-900/60 text-emerald-250 text-sm rounded-2xl flex items-start justify-between gap-3 shadow-lg shadow-emerald-950/5'>
          <div className='flex items-start gap-2.5'>
            <CheckCircle2 className='w-5 h-5 text-emerald-400 shrink-0 mt-0.5' />
            <div className='whitespace-pre-line font-medium leading-relaxed'>
              {successMessage}
            </div>
          </div>
          <button
            onClick={clearMessages}
            className='p-1 hover:bg-emerald-900/20 text-emerald-450 hover:text-emerald-350 rounded-lg transition-colors cursor-pointer'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className='p-4 bg-rose-950/40 border border-rose-900/60 text-rose-250 text-sm rounded-2xl flex items-start justify-between gap-3 shadow-lg shadow-rose-950/5'>
          <div className='flex items-start gap-2.5'>
            <XCircle className='w-5 h-5 text-rose-400 shrink-0 mt-0.5' />
            <div className='whitespace-pre-line font-medium leading-relaxed'>
              {errorMessage}
            </div>
          </div>
          <button
            onClick={clearMessages}
            className='p-1 hover:bg-rose-900/20 text-rose-450 hover:text-rose-350 rounded-lg transition-colors cursor-pointer'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      )}

      {/* Database Management Card */}
      <div className='p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md space-y-6'>
        <div className='flex items-center gap-3 pb-4 border-b border-zinc-850/60'>
          <Database className='w-5 h-5 text-zinc-400' />
          <h3 className='text-md font-bold text-zinc-150'>
            Veritabanı Yönetimi
          </h3>
        </div>

        <div className='space-y-6'>
          {/* Backup Section */}
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='max-w-xl space-y-1'>
              <h4 className='text-sm font-semibold text-zinc-200'>
                Veritabanı Yedek Dosyası Oluştur (Backup)
              </h4>
              <p className='text-xs text-zinc-450 leading-relaxed'>
                Tüm kasalarınızı, envanterinizi ve satış kayıtlarınızı güvenli
                bir yere yedeklemek için bir dosya oluşturun. Bu dosyayı daha
                sonra yeni bir bilgisayara geçiş yaparken veya verilerinizi
                kurtarmak için kullanabilirsiniz.
              </p>
            </div>
            <div>
              <button
                onClick={handleBackup}
                disabled={isLoading}
                className='w-full md:w-auto px-4 py-2.5 bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-900/60 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-all rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                <Download className='w-4 h-4' />
                {backupLoading ? 'Yedekleniyor...' : 'Yedek Dosyası Oluştur'}
              </button>
            </div>
          </div>

          <div className='border-t border-zinc-850/60'></div>

          {/* Restore Section */}
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='max-w-xl space-y-1'>
              <h4 className='text-sm font-semibold text-zinc-200'>
                Veritabanı Yedek Dosyasından Yükle (Restore)
              </h4>
              <p className='text-xs text-zinc-450 leading-relaxed'>
                Bilgisayar değiştirdiğinizde veya yedekten geri yükleme yapmak
                istediğinizde, daha önce aldığınız{' '}
                <code className='bg-zinc-900/60 px-1 py-0.5 rounded border border-zinc-800/80 font-mono text-[10px] text-amber-500'>
                  .db
                </code>{' '}
                veya{' '}
                <code className='bg-zinc-900/60 px-1 py-0.5 rounded border border-zinc-800/80 font-mono text-[10px] text-amber-500'>
                  .sqlite
                </code>{' '}
                dosyasını doğrudan seçerek yükleyebilirsiniz.
              </p>
              <div className='pt-2 flex items-start gap-2 text-[11px] text-amber-500/90 font-medium'>
                <AlertTriangle className='w-4 h-4 shrink-0 mt-0.5 text-amber-500' />
                <span>
                  Dikkat: Yedek dosyası yüklendiğinde mevcut tüm verileriniz
                  silinip yerini yedekteki veriler alacaktır. Bu işlem
                  tamamlandıktan sonra uygulama otomatik olarak yenilenecektir.
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => {
                  if (isPinSet) {
                    setIsPinModalOpen(true);
                  } else {
                    setIsConfirmOpen(true);
                  }
                }}
                disabled={isLoading}
                className='w-full md:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-all rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-600/10'
              >
                <Upload className='w-4 h-4' />
                Yedek Dosyası Yükle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin PIN Settings Card */}
      {/* Döviz & Altın Kurları Entegrasyonu Card */}
      <div className='p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md space-y-6'>
        <div className='flex items-center gap-3 pb-4 border-b border-zinc-850/60'>
          <Coins className='w-5 h-5 text-zinc-400' />
          <h3 className='text-md font-bold text-zinc-150'>
            Döviz & Altın Kuru Entegrasyonu
          </h3>
        </div>

        <form onSubmit={handleSaveRates} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs text-zinc-400 mb-1.5 font-medium'>
                Kur Sağlayıcı Kaynağı
              </label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  if (e.target.value === 'tcmb') {
                    setApiKey('');
                  }
                }}
                className='w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm font-medium'
              >
                <option value='tcmb'>
                  TCMB (Merkez Bankası - Varsayılan, Key Gerekmez)
                </option>
                <option value='altin_api'>
                  AltınAPI (altinapi.com - API Key Gerekir)
                </option>
                <option value='genel_para'>
                  GenelPara (genelpara.com - Ücretli/Key Gerekir)
                </option>
              </select>
            </div>

            {provider !== 'tcmb' && (
              <div>
                <label className='block text-xs text-zinc-400 mb-1.5 font-medium'>
                  API Anahtarı (API Key)
                </label>
                <input
                  type='password'
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder='API Anahtarınızı girin'
                  className='w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm font-mono'
                  required
                />
              </div>
            )}
          </div>

          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2'>
            <p className='text-xs text-zinc-450 leading-relaxed max-w-xl'>
              {provider === 'tcmb'
                ? 'TCMB entegrasyonu tamamen ücretsiz ve sınırsızdır. USD ve EUR canlı çekilir, 24K Has Altın fiyatı ise sistemdeki en son kur değerinden otomatik önerilir.'
                : `${provider === 'altin_api' ? 'AltınAPI' : 'GenelPara'} entegrasyonu seçildiğinde USD, EUR ve 24K Has Altın fiyatları canlı olarak otomatik çekilir.`}
            </p>
            <button
              type='submit'
              disabled={saveLoading || isLoading}
              className='px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-600/10 disabled:opacity-50 cursor-pointer whitespace-nowrap'
            >
              {saveLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </form>
      </div>

      <PinSettingsCard
        isPinSet={isPinSet}
        pinLoading={pinLoading}
        onSetPin={handleSetPin}
        onRemovePin={handleRemovePin}
      />

      {/* Appearance Settings Card */}
      <div className='p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md space-y-6'>
        <div className='flex items-center gap-3 pb-4 border-b border-zinc-850/60'>
          <Sun className='w-5 h-5 text-zinc-400' />
          <h3 className='text-md font-bold text-zinc-150'>Görünüm Ayarları</h3>
        </div>

        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div className='max-w-xl space-y-1'>
            <h4 className='text-sm font-semibold text-zinc-200'>
              Renk Teması Seçimi
            </h4>
            <p className='text-xs text-zinc-450 leading-relaxed'>
              Uygulamanın arayüz renk temasını seçin. Koyu tema (orijinal) veya
              açık tema seçeneklerinden birini tercih edebilirsiniz.
            </p>
          </div>
          <div className='flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850 shrink-0'>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-zinc-450 hover:text-zinc-250 hover:bg-zinc-900/40'
              }`}
            >
              <Sun className='w-4 h-4' />
              Açık Tema
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-zinc-450 hover:text-zinc-250 hover:bg-zinc-900/40'
              }`}
            >
              <Moon className='w-4 h-4' />
              Koyu Tema
            </button>
          </div>
        </div>
      </div>

      {/* Geliştirici Seçenekleri (Yalnızca Geliştirici Modunda) */}
      {import.meta.env.DEV && (
        <div className='p-6 bg-red-950/10 border border-red-900/40 rounded-2xl backdrop-blur-md space-y-6'>
          <div className='flex items-center gap-3 pb-4 border-b border-red-900/20'>
            <AlertTriangle className='w-5 h-5 text-red-500' />
            <h3 className='text-md font-bold text-red-200'>
              Geliştirici Seçenekleri
            </h3>
          </div>

          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='max-w-xl space-y-1'>
              <h4 className='text-sm font-semibold text-zinc-200'>
                Veritabanını Sıfırla (Reset Database)
              </h4>
              <p className='text-xs text-red-400/80 leading-relaxed'>
                Tüm veritabanı tablolarını, envanter, kasa ve ayar kayıtlarını
                silerek uygulamayı tamamen sıfırlar. Bu işlem geri alınamaz.
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                disabled={isLoading}
                className='w-full md:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-550 active:bg-red-700 text-white transition-all rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-red-600/10'
              >
                <Database className='w-4 h-4' />
                Veritabanını Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <RestoreConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          handleRestore();
        }}
        loading={restoreLoading}
      />

      {/* Admin PIN Verification Modal for Restore */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setIsConfirmOpen(true);
        }}
        actionTitle='Yedekten veri yükleme'
      />

      {/* Developer Reset Database Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm'>
          <div className='w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150'>
            <div className='flex items-center gap-3 text-red-500'>
              <AlertTriangle className='w-6 h-6 shrink-0' />
              <h3 className='text-lg font-bold text-zinc-100'>
                Veritabanını Sıfırla?
              </h3>
            </div>

            <p className='text-sm text-zinc-400 leading-relaxed'>
              Bu işlem veritabanındaki tüm kasaları, ürünleri, kategorileri ve
              sistem ayarlarını (PIN dahil) kalıcı olarak silecektir.
              <strong> Bu işlem geri alınamaz!</strong>
            </p>

            <div className='flex items-center gap-3 pt-2'>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className='flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-sm font-bold rounded-xl transition-all cursor-pointer'
              >
                İptal Et
              </button>
              <button
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  handleResetDatabase();
                }}
                className='flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-550 active:bg-red-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer'
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
