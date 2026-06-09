import { useState, useEffect } from 'react';
import VaultDashboard from './features/daily_vault/components/VaultDashboard';
import ProductList from './features/inventory/components/ProductList';
import SalesReportPage from './features/sales_report/components/SalesReportPage';
import SettingsPage from './features/settings/components/SettingsPage';
import CRMPage from './features/crm/components/CRMPage';
import OnboardingWizard from './core/components/OnboardingWizard';
import { useSettings } from './features/settings/hooks/useSettings';
import { getLocalDateString } from './features/daily_vault/hooks/useDailyVault';
import { 
  Briefcase, 
  Layers, 
  BarChart3,
  Settings, 
  HelpCircle,
  Gem,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vault' | 'inventory' | 'sales' | 'settings' | 'crm'>('vault');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

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
      <aside className={`relative bg-zinc-900 border-r border-zinc-800/80 flex flex-col justify-between select-none transition-all duration-300 shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 flex items-center justify-center text-zinc-450 hover:text-zinc-100 transition-all duration-200 shadow-md cursor-pointer z-50 focus:outline-none"
          title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <div>
          {/* Logo Brand */}
          <div className={`p-6 flex items-center gap-2.5 border-b border-zinc-850/60 transition-all duration-300 ${isCollapsed ? 'justify-center px-2 py-4' : ''}`}>
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/10 shrink-0">
              <Gem className="w-5 h-5 text-stone-950 font-bold" />
            </div>
            {!isCollapsed && (
              <div className="transition-opacity duration-200 opacity-100 overflow-hidden whitespace-nowrap">
                <h1 className="text-md font-black tracking-wider text-zinc-100 uppercase">JewelOS</h1>
                <p className="text-[10px] text-amber-500/80 font-bold tracking-widest uppercase">Operating System</p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className={`p-4 space-y-2 transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center rounded-xl transition-all focus:outline-none border ${
                activeTab === 'vault'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              } ${isCollapsed ? 'w-12 h-12 justify-center mx-auto p-0' : 'w-full gap-3 px-4 py-3 text-sm font-semibold'}`}
              title={isCollapsed ? "Günlük Kasa" : undefined}
            >
              <Briefcase className={`w-4 h-4 shrink-0 ${activeTab === 'vault' ? 'text-amber-500' : 'text-zinc-500'}`} />
              {!isCollapsed && <span className="truncate">Günlük Kasa</span>}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center rounded-xl transition-all focus:outline-none border ${
                activeTab === 'inventory'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              } ${isCollapsed ? 'w-12 h-12 justify-center mx-auto p-0' : 'w-full gap-3 px-4 py-3 text-sm font-semibold'}`}
              title={isCollapsed ? "Ürün Yönetimi" : undefined}
            >
              <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'inventory' ? 'text-amber-500' : 'text-zinc-500'}`} />
              {!isCollapsed && <span className="truncate">Ürün Yönetimi</span>}
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center rounded-xl transition-all focus:outline-none border ${
                activeTab === 'sales'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              } ${isCollapsed ? 'w-12 h-12 justify-center mx-auto p-0' : 'w-full gap-3 px-4 py-3 text-sm font-semibold'}`}
              title={isCollapsed ? "Raporlar & Analiz" : undefined}
            >
              <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'sales' ? 'text-amber-500' : 'text-zinc-500'}`} />
              {!isCollapsed && <span className="truncate">Raporlar & Analiz</span>}
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center rounded-xl transition-all focus:outline-none border ${
                activeTab === 'crm'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              } ${isCollapsed ? 'w-12 h-12 justify-center mx-auto p-0' : 'w-full gap-3 px-4 py-3 text-sm font-semibold'}`}
              title={isCollapsed ? "Müşteri / CRM" : undefined}
            >
              <Users className={`w-4 h-4 shrink-0 ${activeTab === 'crm' ? 'text-amber-500' : 'text-zinc-500'}`} />
              {!isCollapsed && <span className="truncate">Müşteri / CRM</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center rounded-xl transition-all focus:outline-none border ${
                activeTab === 'settings'
                  ? 'bg-zinc-800/60 text-zinc-100 border-zinc-700/50 shadow-inner shadow-black/10'
                  : 'border-transparent text-zinc-450 hover:text-zinc-350 hover:bg-zinc-900/40'
              } ${isCollapsed ? 'w-12 h-12 justify-center mx-auto p-0' : 'w-full gap-3 px-4 py-3 text-sm font-semibold'}`}
              title={isCollapsed ? "Sistem Ayarları" : undefined}
            >
              <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-amber-500' : 'text-zinc-500'}`} />
              {!isCollapsed && <span className="truncate">Sistem Ayarları</span>}
            </button>
          </nav>
        </div>

        {/* User Footer / Info */}
        <div className={`p-4 border-t border-zinc-850/60 bg-zinc-900/30 transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3 py-1">
              <div 
                className="w-10 h-10 rounded-xl bg-zinc-950/40 border border-zinc-850/40 flex items-center justify-center cursor-pointer transition-colors hover:bg-zinc-800/40"
                title="Aktif İş Birimi: Has Altın (gr)"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              </div>
              <div className="relative group">
                <HelpCircle className="w-5 h-5 text-zinc-500 hover:text-zinc-400 cursor-pointer transition-colors" />
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block w-56 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl text-[11px] text-zinc-300 leading-relaxed z-50 pointer-events-none">
                  <p className="font-bold text-amber-500 mb-1">Has Altın (Fine Gold)</p>
                  Sistemdeki tüm finansal işlemler, raporlar ve bakiyeler temel iş birimi olan 24K Has Altın (gr) cinsinden takip edilir.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-850/40">
              <div>
                <p className="text-[10px] text-zinc-500 font-semibold">Aktif İş Birimi</p>
                <p className="text-xs text-zinc-300 font-bold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Has Altın (gr)
                </p>
              </div>
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-zinc-500 hover:text-zinc-400 cursor-pointer transition-colors" />
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl text-[11px] text-zinc-300 leading-relaxed z-50 pointer-events-none">
                  <p className="font-bold text-amber-500 mb-1">Has Altın (Fine Gold)</p>
                  Sistemdeki tüm finansal işlemler, raporlar ve bakiyeler temel iş birimi olan 24K Has Altın (gr) cinsinden takip edilir.
                </div>
              </div>
            </div>
          )}

          {isCollapsed ? (
            <div className="mt-2 text-center text-[9px] text-zinc-650 font-bold select-none cursor-help" title={`JewelOS v${__APP_VERSION__} (${import.meta.env.DEV ? 'Geliştirici Modu' : 'Yerel Mod'})`}>
              v{__APP_VERSION__}
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600 px-1 font-semibold select-none">
              <span>JewelOS v{__APP_VERSION__}</span>
              <span>{import.meta.env.DEV ? 'Geliştirici Modu' : 'Yerel Mod'}</span>
            </div>
          )}
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
          {activeTab === 'crm' && <CRMPage activeDate={selectedDate} />}
          {activeTab === 'settings' && <SettingsPage theme={theme} setTheme={setTheme} />}
        </section>
      </main>
    </div>
  );
}
