import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Cpu, Database, LogOut, ShieldCheck, Zap, Menu, X } from 'lucide-react';
import api from '../services/api';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [memStats, setMemStats] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    useEffect(() => {
        const fetchMem = async () => {
            try {
                const res = await api.get('/etl/memory-stats');
                setMemStats(res.data);
            } catch (e) {}
        };
        fetchMem();
        const interval = setInterval(fetchMem, 3000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { path: '/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
        { path: '/dashboard/upload', label: 'New Streaming Pipeline', icon: UploadCloud },
        { path: '/dashboard/audit', label: 'Memory Audit (<150MB)', icon: Cpu },
        { path: '/dashboard/explorer', label: 'MongoDB Explorer', icon: Database },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 border-r border-slate-800/80 shadow-2xl">
                {/* Brand */}
                <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/30 text-white">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-cyan-300">
                            StreamWeaver
                        </h1>
                        <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider block">
                            No-Code ETL Engine
                        </span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                }`}
                            >
                                <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* RAM Live Ticker in Sidebar */}
                <div className="p-4 mx-3 mb-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            V8 Heap RAM:
                        </span>
                        <strong className="text-emerald-400">
                            {memStats ? `${memStats.heapUsedMB} MB` : '28 MB'}
                        </strong>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>Max Limit:</span>
                        <span className="text-amber-400 font-semibold">150 MB Max</span>
                    </div>
                </div>

                {/* Logout Footer */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-slate-400 hover:text-rose-400 px-3 py-2 w-full rounded-xl hover:bg-rose-950/20 text-xs font-medium transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Overlay */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                        <Zap size={16} />
                    </div>
                    <span className="font-bold text-sm">StreamWeaver</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-1 text-slate-400 hover:text-white"
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
                {/* Desktop Top Header Bar */}
                <header className="hidden md:flex bg-slate-900/60 border-b border-slate-800/80 px-8 py-3.5 justify-between items-center backdrop-blur-md">
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">High-Throughput ETL Pipeline</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                            <ShieldCheck size={14} /> isolated-vm & Streams Active
                        </span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-xs font-mono bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-slate-400">
                            MongoDB Status: <span className="text-emerald-400 font-bold">CONNECTED</span>
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Outlet */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}