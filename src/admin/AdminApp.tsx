import { useState } from 'react';
import { isLoggedIn, clearToken } from './adminApi';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminStakes } from './AdminStakes';
import { AdminWithdrawals } from './AdminWithdrawals';
import { AdminUsers } from './AdminUsers';
import { AdminReferrals } from './AdminReferrals';

type Tab = 'dashboard' | 'stakes' | 'withdrawals' | 'referrals' | 'users';

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'stakes', label: 'Stakes', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'withdrawals', label: 'Withdraw', icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'referrals', label: 'Referrals', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
];

export const AdminApp = () => {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col lg:flex-row overflow-x-hidden w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-slate-800/60 bg-[#0b1120] flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-5 border-b border-slate-800/60">
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">RUBIX Staking</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800/60">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-[#0b1120]/95 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-bold text-white">Admin Panel</h1>
          <p className="text-[10px] text-slate-500">RUBIX Staking</p>
        </div>
        <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10">
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 pb-20 lg:pb-0 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'stakes' && <AdminStakes />}
          {activeTab === 'withdrawals' && <AdminWithdrawals />}
          {activeTab === 'referrals' && <AdminReferrals />}
          {activeTab === 'users' && <AdminUsers />}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-800/60 bg-[#0b1120]/95 backdrop-blur-sm safe-bottom">
        <div className="flex">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                activeTab === item.id ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
