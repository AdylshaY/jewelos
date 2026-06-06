import { useState } from 'react';
import VaultDashboard from './features/daily_vault/components/VaultDashboard';
import { 
  Briefcase, 
  Layers, 
  Settings, 
  HelpCircle,
  Gem
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vault' | 'inventory' | 'settings'>('vault');

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden">
      {/* Sidebar Layout */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800/80 flex flex-col justify-between select-none">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-2.5 border-b border-zinc-850/60">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/10">
              <Gem className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <div>
              <h1 className="text-md font-black tracking-wider text-zinc-100 uppercase">JewelOS</h1>
              <p className="text-[10px] text-amber-500/80 font-bold tracking-widest uppercase">Operating System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('vault')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'vault'
                  ? 'bg-zinc-800/60 text-zinc-100 border border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeTab === 'vault' ? 'text-amber-500' : 'text-zinc-500'}`} />
              Günlük Kasa
            </button>

            <button
              onClick={() => {}}
              disabled={true}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl text-zinc-600 cursor-not-allowed group relative"
            >
              <span className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-zinc-750" />
                Ürün Yönetimi
              </span>
              <span className="text-[9px] bg-zinc-850 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800/60 font-semibold tracking-wider uppercase">Yakında</span>
            </button>

            <button
              onClick={() => {}}
              disabled={true}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl text-zinc-600 cursor-not-allowed"
            >
              <span className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-zinc-750" />
                Sistem Ayarları
              </span>
              <span className="text-[9px] bg-zinc-850 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800/60 font-semibold tracking-wider uppercase">Yakında</span>
            </button>
          </nav>
        </div>

        {/* User Footer / Info */}
        <div className="p-4 border-t border-zinc-850/60 bg-zinc-900/30">
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-850/40">
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold">Aktif İş Birimi</p>
              <p className="text-xs text-zinc-300 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Has Altın (gr)
              </p>
            </div>
            <HelpCircle className="w-4 h-4 text-zinc-500 hover:text-zinc-400 cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* Main Panel Area */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/20 backdrop-blur-md select-none">
          <div className="text-xs text-zinc-500 font-semibold">
            JewelOS Monolith &bull; Phase 1 Foundation
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-zinc-450 font-bold">Veritabanı Çevrimdışı (Yerel)</span>
          </div>
        </header>

        <section className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'vault' && <VaultDashboard />}
        </section>
      </main>
    </div>
  );
}
