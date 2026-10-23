import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud,
  Database, 
  Workflow, 
  Eye,
  Code2, 
  Cpu, 
  Settings as SettingsIcon, 
  LogOut,
  User
} from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Dataset', path: '/upload', icon: UploadCloud },
    { name: 'Datasets', path: '/datasets', icon: Database },
    { name: 'Pipeline Builder', path: '/pipeline-builder', icon: Workflow },
    { name: 'Data Preview', path: '/preview', icon: Eye },
    { name: 'Custom Code', path: '/custom-transform', icon: Code2 },
    { name: 'ETL Jobs', path: '/etl-jobs', icon: Cpu },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            SW
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">StreamWeaver</h1>
            <p className="text-[10px] text-indigo-400 font-medium">ETL Pipeline Hub</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Ganesh Kher</p>
              <p className="text-[10px] text-slate-400 truncate">Frontend Engineer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-slate-600">Environment: Ready</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Sprint: Week 3 Active
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}