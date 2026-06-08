import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CloseVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  date: string;
}

export default function CloseVaultModal({
  isOpen,
  onClose,
  onSubmit,
  date,
}: CloseVaultModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit();
      onClose();
    } catch (err: any) {
      setError(err.toString() || 'Kasa kapatılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
            Kasayı Kapat ({date})
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-950/40 border border-red-900/60 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm text-zinc-350 leading-relaxed">
            <strong className="text-zinc-200">{date}</strong> tarihli kasayı kapatmak istediğinize emin misiniz?
          </p>
          
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/30 rounded-xl">
            <p className="text-xs text-rose-350 font-medium leading-relaxed">
              ⚠️ <strong>Önemli Uyarı:</strong> Kasa kapatıldıktan sonra bu güne yeni bakiye girişi, çıkışı veya ürün satışı/iadesi yapılamaz. Bu işlem geri alınamaz.
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
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 bg-rose-650 hover:bg-rose-600 active:bg-rose-700 text-white transition-colors text-sm font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Kasa Kapatılıyor...' : 'Kasayı Kapat'}
          </button>
        </div>
      </div>
    </div>
  );
}
