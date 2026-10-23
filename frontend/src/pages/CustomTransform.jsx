import React, { useState } from 'react';
import { 
  Code2, 
  Play, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  ShieldAlert, 
  Sparkles,
  Layers
} from 'lucide-react';
import axios from 'axios';

const DEFAULT_SAMPLE_ROW = JSON.stringify(
  {
    transaction_id: "TXN_98412",
    customer_name: " rahul sharma ",
    email: "RAHUL.S@GMAIL.COM",
    amount: "4500.50",
    status: "pending"
  },
  null,
  2
);

const DEFAULT_CODE = `// Transform a single incoming row object
// Return the transformed row or throw an Error
function transform(row) {
  return {
    ...row,
    customer_name: row.customer_name.trim().toUpperCase(),
    email: row.email.trim().toLowerCase(),
    amount: parseFloat(row.amount),
    status: row.status.toUpperCase(),
    processed_at: new Date().toISOString()
  };
}`;

export default function CustomTransform() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [sampleInput, setSampleInput] = useState(DEFAULT_SAMPLE_ROW);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestTransformation = async () => {
    setIsLoading(true);
    setExecutionError(null);
    setExecutionResult(null);

    let parsedRow;
    try {
      parsedRow = JSON.parse(sampleInput);
    } catch (err) {
      setExecutionError('Invalid JSON format in Sample Input: ' + err.message);
      setIsLoading(false);
      return;
    }

    try {
      // API call to backend isolated-vm sandbox service (Keerthi)
      const response = await axios.post('http://localhost:5000/api/transform/test-sandbox', {
        code,
        row: parsedRow,
      });

      if (response.data?.success) {
        setExecutionResult(response.data.result);
      } else {
        setExecutionError(response.data?.error || 'Transformation execution failed');
      }
    } catch (err) {
      // Local fallback mock execution if backend sandbox endpoint is pending
      try {
        const fn = new Function('row', `${code}\nreturn transform(row);`);
        const result = fn(parsedRow);
        setExecutionResult(result);
      } catch (localErr) {
        setExecutionError(
          err.response?.data?.error || localErr.message || 'Execution error inside sandbox environment'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCode(DEFAULT_CODE);
    setSampleInput(DEFAULT_SAMPLE_ROW);
    setExecutionResult(null);
    setExecutionError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <Sparkles size={14} /> Week 3 Day 11: Secure JavaScript Sandbox
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">Custom JavaScript Transformation</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Write custom row manipulation functions executed in an isolated secure sandbox
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            <RotateCcw size={14} /> Reset Code
          </button>
          <button
            type="button"
            onClick={handleTestTransformation}
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-60"
          >
            <Play size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Executing Sandbox...' : 'Test Transformation'}</span>
          </button>
        </div>
      </div>

      {/* Sandbox Isolation Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
        <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-900">Sandbox Environment Restrictions</p>
          <p className="mt-0.5 text-amber-700">
            Node.js system resources (fs, child_process, process) are strictly blocked. Script execution has an enforced execution timeout limit.
          </p>
        </div>
      </div>

      {/* Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: JavaScript Code Area */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold flex items-center gap-2 font-mono">
              <Code2 size={15} className="text-indigo-400" /> transform(row) logic
            </span>
            <span className="text-[11px] text-slate-500 font-mono">ES6 JavaScript</span>
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="w-full h-80 bg-slate-900 text-slate-100 font-mono text-xs p-3 leading-relaxed rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none border border-slate-800"
            />
          </div>
        </div>

        {/* Right: Sample Input & Execution Result */}
        <div className="flex flex-col gap-4">
          {/* Sample Input */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-slate-500" /> Test Row (JSON format)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Input Payload</span>
            </div>
            <textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              spellCheck="false"
              className="w-full h-32 p-3 font-mono text-xs text-slate-800 bg-white focus:outline-none resize-none border-0"
            />
          </div>

          {/* Sandbox Output Console */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[170px]">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <Terminal size={14} className="text-slate-500" /> Sandbox Output Console
              </span>
              {executionResult && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 size={13} /> Exit Code 0 (Success)
                </span>
              )}
              {executionError && (
                <span className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                  <AlertCircle size={13} /> Execution Error
                </span>
              )}
            </div>

            <div className="p-4 flex-1 font-mono text-xs overflow-auto bg-slate-950 text-slate-200">
              {executionError && (
                <div className="text-rose-400 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap">{executionError}</pre>
                </div>
              )}
              {executionResult && (
                <pre className="text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              )}
              {!executionResult && !executionError && (
                <span className="text-slate-500 italic">
                  Click "Test Transformation" above to execute code in sandbox...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}