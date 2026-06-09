import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Sun,
  Moon,
  ShieldAlert,
  Lock,
  Copy,
  Check,
  CheckCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface OnboardingWizardProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onComplete: () => void;
  handleSetPin: (newPin: string) => Promise<string | null>;
}

export default function OnboardingWizard({
  theme,
  setTheme,
  onComplete,
  handleSetPin,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Recovery key states
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  const handleCopy = async () => {
    if (!recoveryKey) return;
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleSetSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length < 4) {
      setError('PIN kodu en az 4 karakter olmalıdır.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const key = await handleSetPin(pin);
      if (key) {
        setRecoveryKey(key);
      } else {
        setStep(3);
      }
    } catch (err: any) {
      setError(err?.toString() || 'PIN kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipSecurity = () => {
    setStep(3);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await invoke('complete_onboarding');
      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-zinc-950 p-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-radial-at-t from-zinc-900 to-zinc-950 pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-zinc-900/60 border border-zinc-800/80 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Logo and Welcome */}
        <div className="flex flex-col items-center text-center space-y-2 pb-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">JewelOS'a Hoş Geldiniz</h2>
          <p className="text-xs text-zinc-400">Modüler Kuyumcu İşletim Sistemi İlk Yapılandırma</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-1.5 px-16">
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
        </div>

        {/* STEP 1: Appearance Preferences */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5 text-center">
              <h3 className="text-sm font-semibold text-zinc-200">Görünüm Tercihinizi Belirleyin</h3>
              <p className="text-xs text-zinc-450">Uygulamanın renk temasını seçin (istediğiniz zaman Ayarlar sayfasından değiştirebilirsiniz)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-5 rounded-2xl border text-center flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-amber-500/80 shadow-md shadow-amber-500/5 text-amber-500'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200'
                }`}
              >
                <Moon className="w-6 h-6" />
                <span className="text-xs font-bold">Koyu Tema (Önerilen)</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-5 rounded-2xl border text-center flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-zinc-950 border-amber-500/80 shadow-md shadow-amber-500/5 text-amber-500'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200'
                }`}
              >
                <Sun className="w-6 h-6" />
                <span className="text-xs font-bold">Açık Tema</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              Devam Et <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Security Configurations */}
        {step === 2 && !recoveryKey && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5 text-center">
              <h3 className="text-sm font-semibold text-zinc-200">Yönetici Güvenliği</h3>
              <p className="text-xs text-zinc-450">
                Kasa kapatma, stok silme ve veri geri yükleme gibi kritik işlemler için yönetici şifresi belirleyin.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/30 border border-rose-900/40 text-rose-250 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-450" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSetSecurity} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">PIN Kodu</label>
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    maxLength={6}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-center font-mono text-zinc-200 outline-none focus:border-amber-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">PIN (Tekrar)</label>
                  <input
                    type="password"
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    maxLength={6}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-center font-mono text-zinc-200 outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSkipSecurity}
                  className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-350 transition-colors text-xs font-bold rounded-xl cursor-pointer"
                >
                  Şimdilik Şifresiz Geç
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-600/10 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" /> PIN Belirle
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2.5: Recovery Key Setup */}
        {step === 2 && recoveryKey && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1">
                <span className="font-semibold block text-zinc-100">Kurtarma Anahtarını Kaydedin</span>
                <span>PIN kodunu unutursanız verilerinizi kurtarmanın tek yolu bu yerel anahtardır. Bu anahtar <b>bir daha asla gösterilmeyecektir.</b></span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Şifre Kurtarma Anahtarı</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-center text-lg font-mono font-bold tracking-wider text-amber-500">
                  {recoveryKey}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-3.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  title="Kopyala"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 bg-zinc-950/40 border border-zinc-850/40 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasSavedKey}
                onChange={(e) => setHasSavedKey(e.target.checked)}
                className="mt-0.5 accent-amber-600 rounded border-zinc-800"
              />
              <span className="text-xs text-zinc-350 leading-relaxed font-medium">
                Kurtarma anahtarımı kopyaladığımı veya güvenli bir yere kaydettiğimi onaylıyorum.
              </span>
            </label>

            <button
              type="button"
              disabled={!hasSavedKey}
              onClick={() => setStep(3)}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/10"
            >
              <CheckCircle className="w-4 h-4" />
              Doğrula ve Tamamla
            </button>
          </div>
        )}

        {/* STEP 3: Setup Completed */}
        {step === 3 && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-md font-bold text-zinc-150">Yapılandırma Tamamlandı!</h3>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                JewelOS kullanıma hazır. Günlük Kasa Defteri ve Envanter Yönetimi modüllerini kullanarak işlemlerinizi takip etmeye başlayabilirsiniz.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-amber-600/10 transition-all"
            >
              {loading ? 'Tamamlanıyor...' : 'Başlayalım!'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
