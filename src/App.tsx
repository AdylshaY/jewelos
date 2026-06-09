import { useState, useEffect } from 'react';
import VaultDashboard from './features/daily_vault/components/VaultDashboard';
import ProductList from './features/inventory/components/ProductList';
import SalesReportPage from './features/sales_report/components/SalesReportPage';
import SettingsPage from './features/settings/components/SettingsPage';
import OnboardingWizard from './core/components/OnboardingWizard';
import { useSettings } from './features/settings/hooks/useSettings';
import { getLocalDateString } from './features/daily_vault/hooks/useDailyVault';
import { 
  Briefcase, 
  Layers, 
  BarChart3,
  Settings, 
  HelpCircle,
  Gem
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vault' | 'inventory' | 'sales' | 'settings'>('vault');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());

  const {
    isOnboardingCompleted,
    handleCompleteOnboarding,
    handleSetPin,
  } = useSettings();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    // Force WebView layout reflow/repaint to avoid repaint lag on theme toggle
    const body = document.body;
    if (body) {
      const originalDisplay = body.style.display;
      body.style.display = 'none';
      body.offsetHeight; // Forces a synchronous reflow of the rendering tree
      body.style.display = originalDisplay;
    }
  }, [theme]);

  if (isOnboardingCompleted === null) {
    return <div className="w-screen h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-medium">Sistem yükleniyor...</div>;
  }

  if (isOnboardingCompleted === false) {
    return (
      <OnboardingWizard
        theme={theme}
        setTheme={setTheme}
        onComplete={handleCompleteOnboarding}
        handleSetPin={handleSetPin}
      />
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden">
      {/* Sidebar Layout */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800/80 flex flex-col justify-between select-none">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-2.5 border-b border-zinc-850/60">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/10">
              <Gem className="w-5 h-5 text-stone-950 font-bold" />
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
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all focus:outline-none border ${
                activeTab === 'vault'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeTab === 'vault' ? 'text-amber-500' : 'text-zinc-500'}`} />
              Günlük Kasa
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all focus:outline-none border ${
                activeTab === 'inventory'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-amber-500' : 'text-zinc-500'}`} />
              Ürün Yönetimi
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all focus:outline-none border ${
                activeTab === 'sales'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'sales' ? 'text-amber-500' : 'text-zinc-500'}`} />
              Satış Raporları
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all focus:outline-none border ${
                activeTab === 'settings'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-amber-500' : 'text-zinc-500'}`} />
              Sistem Ayarları
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
          <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600 px-1 font-semibold select-none">
            <span>JewelOS v{__APP_VERSION__}</span>
            <span>{import.meta.env.DEV ? 'Geliştirici Modu' : 'Yerel Mod'}</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Area */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto">
        <section className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'vault' && (
            <VaultDashboard selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          )}
          {activeTab === 'inventory' && (
            <ProductList activeDate={selectedDate} />
          )}
          {activeTab === 'sales' && <SalesReportPage theme={theme} />}
          {activeTab === 'settings' && <SettingsPage theme={theme} setTheme={setTheme} />}
        </section>
      </main>
    </div>
  );
}
