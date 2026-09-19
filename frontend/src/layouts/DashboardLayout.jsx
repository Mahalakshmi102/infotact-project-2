import { Outlet, Link } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Basic Sidebar Layout */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-indigo-400 tracking-wider">StreamWeaver</h2>
          <nav className="mt-8 flex flex-col gap-3">
            <Link to="/" className="text-slate-300 hover:text-white transition">Dashboard</Link>
            <Link to="/upload" className="text-slate-300 hover:text-white transition">Upload Dataset</Link>
          </nav>
        </div>
        <div className="text-xs text-slate-500">Week 1 Foundation Setup</div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}