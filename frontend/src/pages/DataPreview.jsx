import React, { useState } from 'react';
import { 
  Play, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  FileSpreadsheet, 
  Eye, 
  Filter 
} from 'lucide-react';

export default function DataPreview() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasPreviewRun, setHasPreviewRun] = useState(false);
  const [activeTab, setActiveTab] = useState('sideBySide'); // 'sideBySide' | 'transformedOnly'

  // Raw original sample rows (Before Transformation)
  const originalData = [
    { id: 1, name: '   rahul sharma  ', email: 'RAHUL.S@GMAIL.COM', amount: '4500.50', status: 'pending' },
    { id: 2, name: 'PRIYA VERMA', email: '  priya.v@outlook.com ', amount: '1200.00', status: 'completed' },
    { id: 3, name: 'amit   kumar', email: 'AMIT.KUMAR@YAHOO.COM', amount: '890.25', status: 'pending' },
    { id: 4, name: '  sneha patel ', email: 'Sneha.P@Domain.org', amount: '3420.00', status: 'completed' },
    { id: 5, name: 'vikram singh', email: 'vikram.singh@service.in  ', amount: '150.75', status: 'failed' },
  ];

  // Transformed sample rows (After Uppercase, Lowercase, Trim rules)
  const transformedData = [
    { id: 1, name: 'RAHUL SHARMA', email: 'rahul.s@gmail.com', amount: 4500.5, status: 'PENDING' },
    { id: 2, name: 'PRIYA VERMA', email: 'priya.v@outlook.com', amount: 1200.0, status: 'COMPLETED' },
    { id: 3, name: 'AMIT KUMAR', email: 'amit.kumar@yahoo.com', amount: 890.25, status: 'PENDING' },
    { id: 4, name: 'SNEHA PATEL', email: 'sneha.p@domain.org', amount: 3420.0, status: 'COMPLETED' },
    { id: 5, name: 'VIKRAM SINGH', email: 'vikram.singh@service.in', amount: 150.75, status: 'FAILED' },
  ];

  const handleRunPreview = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasPreviewRun(true);
    }, 600);
  };

  const handleReset = () => {
    setHasPreviewRun(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <Eye size={14} /> Week 2 Day 9 Milestone: Pipeline Data Preview
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">Transform Before / After Preview</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Test transformations on a small data sample without mutating your database
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasPreviewRun && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}

          <button
            onClick={handleRunPreview}
            disabled={isRunning}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition ${
              isRunning ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <Play size={16} className={isRunning ? 'animate-spin' : ''} />
            <span>{isRunning ? 'Processing Stream...' : 'Run Preview'}</span>
          </button>
        </div>
      </div>

      {/* Applied Pipeline Rules Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Filter size={14} className="text-indigo-600" /> Active Rules:
        </span>
        <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
          customer_name → UPPERCASE + TRIM
        </span>
        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
          email → LOWERCASE + TRIM
        </span>
        <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-100">
          amount → CAST(Number)
        </span>
        <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100">
          status → UPPERCASE
        </span>
      </div>

      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('sideBySide')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'sideBySide' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setActiveTab('transformedOnly')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'transformedOnly' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Transformed Result Only
          </button>
        </div>

        <div className="text-xs font-medium text-slate-500">
          Showing sample: <span className="font-bold text-slate-700">5 sample rows</span>
        </div>
      </div>

      {/* Tables View */}
      {activeTab === 'sideBySide' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BEFORE TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileSpreadsheet size={15} className="text-slate-400" /> Source Data (Raw / Before)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">Original</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600 font-mono">
                  {originalData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 whitespace-pre">{row.name}</td>
                      <td className="py-2.5 px-4 whitespace-pre">{row.email}</td>
                      <td className="py-2.5 px-4">{row.amount}</td>
                      <td className="py-2.5 px-4">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AFTER TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
            <div className="p-4 border-b border-slate-200 bg-indigo-50/50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Sparkles size={15} /> Pipeline Output (After Transformation)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono">
                Transformed
              </span>
            </div>

            {hasPreviewRun ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {transformedData.map((row) => (
                      <tr key={row.id} className="hover:bg-indigo-50/40 bg-indigo-50/10">
                        <td className="py-2.5 px-4 text-indigo-900 font-semibold">{row.name}</td>
                        <td className="py-2.5 px-4 text-emerald-700">{row.email}</td>
                        <td className="py-2.5 px-4 font-mono">{row.amount.toFixed(2)}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                  <Play size={22} className="ml-0.5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Preview Not Executed Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Click the <strong>Run Preview</strong> button above to execute transformation stream on this sample.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SINGLE TRANSFORMED VIEW */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Transformed Dataset Preview</h3>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} /> Ready for MongoDB Sink
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-6">Record #</th>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Amount (USD)</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {(hasPreviewRun ? transformedData : originalData).map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-mono text-slate-400">#{idx + 1}</td>
                    <td className="py-3 px-6 font-semibold">{row.name}</td>
                    <td className="py-3 px-6 text-slate-600">{row.email}</td>
                    <td className="py-3 px-6 font-mono">{String(row.amount)}</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}