import React from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Database, Workflow, Eye, CheckCircle2, Clock, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { title: 'Total Datasets', count: '4', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Pipelines Built', count: '2', icon: Workflow, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Completed Ingestions', count: '3', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Preview Tested', count: '5', icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full border border-indigo-400/20">
            Week 2 Milestone Complete
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight">StreamWeaver Visual ETL Hub</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-xl">
            No-Code Visual Pipeline Builder, Transformation Engine and Live Data Preview fully integrated.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/pipeline-builder"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Workflow size={18} />
            <span>Open Builder</span>
          </Link>
          <Link
            to="/preview"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition border border-slate-700"
          >
            <Eye size={18} />
            <span>Run Preview</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
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

      {/* Week 2 Verification Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Week 2 Deliverable Verification</h2>
        <div className="divide-y divide-slate-100 text-sm text-slate-600">
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Day 6: Dataset Details & Column Detection UI
            </span>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">Completed</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Day 7: Transformation Engine (Uppercase, Trim, Cast Number)
            </span>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">Completed</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Day 8: React Flow Visual Pipeline Canvas & Custom Nodes
            </span>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">Completed</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Day 9: Before / After Data Preview Table with Run Button
            </span>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">Completed</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Day 10: Full Pipeline Integration & Design Polishing
            </span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">Ready for Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}