import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Lock, X, AlertCircle } from 'lucide-react';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

export default function PinVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Bu işlem',
}: PinVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinRequired, setPinRequired] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setLoading(false);

      // Check if admin PIN is configured
      invoke<boolean>('is_admin_pin_set')
        .then((isSet) => {
          setPinRequired(isSet);
          if (!isSet) {
            // No PIN is configured, bypass verification and trigger action directly
            onSuccess();
          }
        })
        .catch((err) => {
          console.error('Failed to check if PIN is set:', err);
          setError('Sistem güvenlik kontrolü başarısız oldu.');
          setPinRequired(true); // Default to safe lock
        });
    }
  }, [isOpen]);

  if (!isOpen || pinRequired === false) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const isValid = await invoke<boolean>('verify_admin_pin', { pin });
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        setError('Hatalı yönetici PIN kodu. Lütfen tekrar deneyin.');
        setPin('');
      }
    } catch (err: any) {
      setError(err?.toString() || 'Doğrulama hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-zinc-150">Yönetici Doğrulaması</h3>
              <p className="text-xs text-zinc-400">Yetkisiz erişimi engellemek için PIN girin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-850/60 rounded-xl text-xs text-zinc-350 leading-relaxed">
          <span className="font-semibold text-amber-500">{actionTitle}</span> güvenlik protokolü gereği yönetici iznine tabidir. Devam etmek için şifrenizi doğrulamanız gerekmektedir.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Yönetici PIN Kodu</label>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              disabled={loading || pinRequired === null}
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-center text-lg font-mono text-zinc-100 placeholder-zinc-650 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-900/40 text-rose-250 text-xs rounded-xl flex items-start gap-2 animate-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-750 transition-colors text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading || !pin.trim() || pinRequired === null}
              className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-600/10 hover:shadow-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula ve Devam Et'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
