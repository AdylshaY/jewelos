import { AlertTriangle, X } from 'lucide-react';

interface RestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export default function RestoreConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: RestoreConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            Veritabanını Geri Yükle
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-350 leading-relaxed">
            Seçtiğiniz yedek dosyası yüklenirken mevcut verileriniz silinecektir. Bu işlem geri alınamaz.
          </p>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-450 font-medium leading-relaxed">
              ⚠️ <strong>Önemli Uyarı:</strong> Geri yükleme tamamlandıktan sonra uygulama verileri güncellemek için otomatik olarak yenilenecektir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-900/30 border-t border-zinc-850 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition-colors text-sm font-medium rounded-xl border border-zinc-750 cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-colors text-sm font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-600/10"
          >
            {loading ? 'Geri Yükleniyor...' : 'Yedek Dosyası Seç ve Yükle'}
          </button>
        </div>
      </div>
    </div>
  );
}
