
import React, { useState, useEffect } from 'react';
import { UserProfile, UsageRecord, GeneratedExcuseResponse, Outcome, CustomTemplate } from './types';
import { INITIAL_PROFILE } from './constants';
import Dashboard from './components/Dashboard';
import Generator from './components/Generator';
import History from './components/History';
import Settings from './components/Settings';
import { db } from './services/dbService';
import { LayoutDashboard, Shield, History as HistoryIcon, Info, Settings as SettingsIcon, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generate' | 'history' | 'settings'>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        await db.init();
        const [savedProfile, savedHistory, savedTemplates] = await Promise.all([
          db.getProfile(),
          db.getHistory(),
          db.getTemplates()
        ]);
        setProfile(savedProfile || INITIAL_PROFILE);
        setHistory(savedHistory || []);
        setCustomTemplates(savedTemplates || []);
      } catch (err) {
        console.error("DB Init failed", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initData();
  }, []);

  const handleExcuseUsed = async (excuse: GeneratedExcuseResponse, context: string, wasTrue: boolean) => {
    // CONSEQUENCE ENGINE LOGIC
    // Fiction cost increases with "Honesty Debt" (Interest)
    const interestMultiplier = 1 + (profile.honestyDebt * 0.05);
    const categoryFatigue = history.filter(h => h.category === excuse.category).length * 0.15;
    
    const impact = wasTrue 
      ? 0.06 // Truth bonus
      : -0.12 * (1 + categoryFatigue) * interestMultiplier; // Fiction penalty with interest
    
    const newRecord: UsageRecord = {
      id: Math.random().toString(36).substr(2, 9),
      excuseId: 'generated',
      category: excuse.category,
      context: excuse.excuse,
      timestamp: new Date().toISOString(),
      confidenceWhenUsed: excuse.basePlausibility,
      wasTrue: wasTrue,
      credibilityImpact: impact
    };

    const newHistory = [...history, newRecord];
    setHistory(newHistory);
    await db.saveHistory(newRecord);
    
    const newCred = Math.max(0, Math.min(1, profile.overallCredibility + impact));
    // Debt decreases on truth, increases on fiction
    const newDebt = wasTrue ? Math.max(0, profile.honestyDebt - 1) : profile.honestyDebt + 1;
    
    const counts: any = {};
    newHistory.slice(-20).forEach(h => counts[h.category] = (counts[h.category] || 0) + 1);
    const overused = Object.keys(counts).filter(cat => counts[cat] > 3) as any[];

    const updatedProfile = {
      ...profile,
      overallCredibility: newCred,
      honestyDebt: newDebt,
      overusedCategories: overused,
      riskScore: Math.min(1, (1 - newCred) + (overused.length * 0.15))
    };
    
    setProfile(updatedProfile);
    await db.saveProfile(updatedProfile);

    setActiveTab('history');
  };

  const handleReflect = async (id: string, outcome: Outcome, rating: number, notes: string) => {
    let updatedRecord: UsageRecord | null = null;
    const newHistory = history.map(h => {
      if (h.id === id) {
        updatedRecord = { ...h, outcome, selfRatingAfter: rating, reflectionNotes: notes };
        return updatedRecord;
      }
      return h;
    });
    
    setHistory(newHistory);
    if (updatedRecord) await db.saveHistory(updatedRecord);

    // Hard penalty if rejected by the audience
    if (outcome === Outcome.REJECTED) {
      const updatedProfile = {
        ...profile,
        overallCredibility: Math.max(0, profile.overallCredibility - 0.25),
        honestyDebt: profile.honestyDebt + 3
      };
      setProfile(updatedProfile);
      await db.saveProfile(updatedProfile);
    }
  };

  const addCustomTemplate = async (template: Omit<CustomTemplate, 'id'>) => {
    const newTemplate = { ...template, id: Math.random().toString(36).substr(2, 9) };
    setCustomTemplates(prev => [...prev, newTemplate]);
    await db.saveTemplate(newTemplate);
  };

  const deleteCustomTemplate = async (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    await db.deleteTemplate(id);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Synchronizing Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-inner">S</div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Excuse Generator</h1>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
             <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-full border border-slate-100">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SQL Ledger Active
             </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {activeTab === 'dashboard' && 'Accountability Dashboard'}
            {activeTab === 'generate' && 'Request Pardon'}
            {activeTab === 'history' && 'Public Record'}
            {activeTab === 'settings' && 'Advanced Preferences'}
          </h2>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl leading-relaxed">
            {activeTab === 'dashboard' && 'A forensic visualization of your standing in the ecosystem of trust. Every debt carries interest.'}
            {activeTab === 'generate' && 'Deploy a strategic response. High specificity increases plausibility, while repetition invites audit.'}
            {activeTab === 'history' && 'A chronological ledger of all pardons requested and their subsequent resolutions.'}
            {activeTab === 'settings' && 'Fine-tune your personal templates and manage your local SQLite database.'}
          </p>
        </div>

        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && <Dashboard profile={profile} history={history} />}
          {activeTab === 'generate' && <Generator profile={profile} history={history} customTemplates={customTemplates} onExcuseUsed={handleExcuseUsed} />}
          {activeTab === 'history' && <History history={history} onReflect={handleReflect} />}
          {activeTab === 'settings' && <Settings templates={customTemplates} onAdd={addCustomTemplate} onDelete={deleteCustomTemplate} />}
        </div>
      </main>

      {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
      <nav className="fixed top-16 left-0 bottom-0 w-20 bg-white border-r border-slate-100 hidden lg:flex flex-col items-center py-8 gap-6 z-40">
        <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Audit" />
        <NavItem active={activeTab === 'generate'} onClick={() => setActiveTab('generate')} icon={<Shield size={20} />} label="Shield" />
        <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<HistoryIcon size={20} />} label="Log" />
        <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label="Prefs" />
      </nav>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none"></div>
        <nav className="relative bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] px-4 pb-safe-area-inset-bottom">
          <div className="flex justify-around items-stretch h-20 max-w-md mx-auto">
            <MobileNavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard size={24} />} 
              label="Audit" 
            />
            <MobileNavItem 
              active={activeTab === 'generate'} 
              onClick={() => setActiveTab('generate')} 
              icon={<Shield size={24} />} 
              label="Shield" 
            />
            <MobileNavItem 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
              icon={<HistoryIcon size={24} />} 
              label="Log" 
            />
            <MobileNavItem 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<SettingsIcon size={24} />} 
              label="Prefs" 
            />
          </div>
        </nav>
      </div>

      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-slate-200 mt-20 text-slate-400">
        <div className="flex flex-col md:flex-row justify-between gap-10 items-start">
          <div className="max-w-sm">
            <h4 className="font-black text-slate-900 mb-3 text-sm uppercase tracking-widest">Ethical Disclaimer</h4>
            <p className="text-xs leading-relaxed font-medium">
              This application is a behavioral mirror. It models the social decay inherent in non-factual pardon requests. 
              The algorithm prioritizes consistency over creativity. All data is persisted in an encrypted local SQLite container.
            </p>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-wrap justify-between items-center text-[9px] uppercase tracking-[0.2em] font-black gap-4">
          <span>&copy; 2026 Social Capital Accountability Org.</span>
          <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-slate-600">
            <Info size={12} className="text-indigo-500" /> WebAssembly SQLite Instance v1.12.0
          </span>
        </div>
      </footer>
    </div>
  );
};

// Desktop Navigation Item
const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
      active 
        ? 'text-indigo-600 bg-indigo-50 shadow-sm scale-105' 
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span className="text-[9px] font-black mt-1.5 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
  </button>
);

// Mobile Navigation Item
const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactElement; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`relative flex flex-col items-center justify-center flex-1 py-3 transition-all active:scale-95 touch-manipulation ${
      active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-500'
    }`}
  >
    {active && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_2px_10px_rgba(79,70,229,0.4)] animate-in slide-in-from-top-1 duration-300" />
    )}
    <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { strokeWidth: active ? 2.5 : 2 })}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 transition-all ${
      active ? 'opacity-100' : 'opacity-70'
    }`}>
      {label}
    </span>
    <div className="absolute inset-0 z-0" />
  </button>
);

export default App;
