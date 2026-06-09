import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check } from 'lucide-react';

interface PinSettingsCardProps {
  isPinSet: boolean | null;
  pinLoading: boolean;
  onSetPin: (newPin: string, currentPin?: string) => Promise<void>;
  onRemovePin: (currentPin: string) => Promise<void>;
}

export default function PinSettingsCard({
  isPinSet,
  pinLoading,
  onSetPin,
  onRemovePin,
}: PinSettingsCardProps) {
  const [mode, setMode] = useState<'idle' | 'set' | 'change' | 'remove'>('idle');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setMode('idle');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'set' || mode === 'change') {
      if (newPin.length < 4) {
        setError('PIN kodu en az 4 karakter olmalıdır.');
        return;
      }
      if (newPin !== confirmPin) {
        setError('Yeni şifreler eşleşmiyor.');
        return;
      }
      try {
        await onSetPin(newPin, mode === 'change' ? currentPin : undefined);
        resetForm();
      } catch (err: any) {
        setError(err.toString());
      }
    } else if (mode === 'remove') {
      try {
        await onRemovePin(currentPin);
        resetForm();
      } catch (err: any) {
        setError(err.toString());
      }
    }
  };

  if (isPinSet === null) return null;

  return (
    <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-850/60">
        <KeyRound className="w-5 h-5 text-zinc-400" />
        <h3 className="text-md font-bold text-zinc-150">Yönetici PIN Kodu Koruması</h3>
      </div>

      {mode === 'idle' ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl space-y-1">
            <h4 className="text-sm font-semibold text-zinc-200">
              {isPinSet ? 'PIN Koruması Etkin' : 'PIN Koruması Pasif'}
            </h4>
            <p className="text-xs text-zinc-450 leading-relaxed">
              {isPinSet
                ? 'Kasa kapatma, envanter silme ve veritabanı geri yükleme işlemleri yönetici onayına tabidir. PIN koruması şu anda aktiftir.'
                : 'Kritik işlemler (kasa kapatma, stok silme vb.) şifre doğrulaması olmadan gerçekleştirilir. Güvenlik için bir yönetici PIN kodu belirlemeniz önerilir.'}
            </p>
          </div>
          <div className="flex gap-2">
            {!isPinSet ? (
              <button
                onClick={() => setMode('set')}
                className="w-full md:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-all rounded-xl text-xs font-bold shadow-lg shadow-amber-600/10 cursor-pointer"
              >
                PIN Kodu Belirle
              </button>
            ) : (
              <>
                <button
                  onClick={() => setMode('change')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-all cursor-pointer"
                >
                  Değiştir
                </button>
                <button
                  onClick={() => setMode('remove')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/40 text-rose-300 transition-all cursor-pointer"
                >
                  Korumayı Kaldır
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 max-w-md animate-in fade-in duration-150">
          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
            {mode === 'set' && 'Yönetici PIN Kodu Belirle'}
            {mode === 'change' && 'PIN Kodu Değiştir'}
            {mode === 'remove' && 'PIN Korumasını Kaldır'}
          </h4>

          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-900/40 text-rose-200 text-xs rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {(mode === 'change' || mode === 'remove') && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">Mevcut Yönetici PIN Kodu</label>
                <input
                  type="password"
                  required
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-sm font-mono text-zinc-200 outline-none focus:border-amber-600"
                />
              </div>
            )}

            {(mode === 'set' || mode === 'change') && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Yeni PIN Kodu</label>
                  <input
                    type="password"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="En az 4 karakter"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-sm font-mono text-zinc-200 outline-none focus:border-amber-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Yeni PIN Kodu (Tekrar)</label>
                  <input
                    type="password"
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="En az 4 karakter"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-sm font-mono text-zinc-200 outline-none focus:border-amber-600"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={pinLoading}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={pinLoading}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-600/10"
            >
              <Check className="w-4 h-4" />
              {pinLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
