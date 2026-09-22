import { Link } from 'react-router-dom';
import { UploadCloud, Database, Cpu, CheckCircle2, Clock, Loader2, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { title: 'Total Datasets', count: '4', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'In Processing', count: '1', icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Completed', count: '1', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Pending Streams', count: '1', icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full border border-indigo-400/20">
            Week 1 Milestone
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight">StreamWeaver Ingestion Hub</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-xl">
            Stream massive CSV and JSON files into native Node.js streams without memory leaks.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            to="/upload"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <UploadCloud size={18} />
            <span>Upload File</span>
          </Link>
          <Link
            to="/datasets"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition border border-slate-700"
          >
            <Database size={18} />
            <span>View Datasets</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${item.bg} ${item.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{item.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{item.count}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Navigation Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Week 1 Verification Checklist</h2>
        <div className="divide-y divide-slate-100 text-sm text-slate-600">
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> User Authentication & Protected Routes
            </span>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">Passed</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Drag-and-Drop Large File Upload UI
            </span>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">Passed</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Dataset Processing Status Pipeline UI
            </span>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">Passed</span>
          </div>
        </div>
      </div>
    </div>
  );
}