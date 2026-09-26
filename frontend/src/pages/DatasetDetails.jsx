import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Layers, 
  Database, 
  ArrowLeft, 
  Hash, 
  Type, 
  Calendar, 
  ToggleLeft,
  Workflow,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';

export default function DatasetDetails() {
  const { id } = useParams();

  const [dataset, setDataset] = useState({
    _id: id || '1',
    fileName: 'customer_transactions_large.csv',
    fileSize: 2147483648,
    fileType: 'csv',
    totalRows: 5000000,
    status: 'Completed',
    columns: [
      { name: 'transaction_id', type: 'Number', sample: '98412' },
      { name: 'customer_name', type: 'String', sample: 'Rahul Sharma' },
      { name: 'email', type: 'String', sample: 'rahul.s@example.com' },
      { name: 'amount', type: 'Number', sample: '4500.50' },
      { name: 'created_at', type: 'Date', sample: '2026-09-20' },
      { name: 'is_verified', type: 'Boolean', sample: 'true' },
    ],
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/datasets/${id}`);
        if (res.data) setDataset(res.data);
      } catch (err) {
        // fallback to default mock
      }
    };
    fetchDetails();
  }, [id]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeBadge = (type = '') => {
    switch (type.toLowerCase()) {
      case 'string':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Type size={13} /> String</span>;
      case 'number':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><Hash size={13} /> Number</span>;
      case 'date':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"><Calendar size={13} /> Date</span>;
      case 'boolean':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><ToggleLeft size={13} /> Boolean</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/datasets" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} /> Back to Datasets
        </Link>
        <Link to="/pipeline-builder" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
          <Workflow size={16} /> Create Pipeline
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FileSpreadsheet size={24} /></div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase">File Name</p>
            <p className="text-sm font-bold text-slate-800 truncate" title={dataset.fileName}>{dataset.fileName}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Database size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Rows</p>
            <p className="text-lg font-bold text-slate-800">{dataset.totalRows?.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl"><Layers size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Columns</p>
            <p className="text-lg font-bold text-slate-800">{dataset.columns?.length || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Hash size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">File Size</p>
            <p className="text-lg font-bold text-slate-800">{formatFileSize(dataset.fileSize)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Detected Schema & Columns</h2>
            <p className="text-xs text-slate-500 mt-0.5">Auto-detected column names and inferred data types from streaming parser</p>
          </div>
          <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium">Format: {dataset.fileType?.toUpperCase()}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">#</th>
                <th className="py-3 px-6">Column Name</th>
                <th className="py-3 px-6">Detected Data Type</th>
                <th className="py-3 px-6">Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {dataset.columns?.map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">{col.name}</td>
                  <td className="py-3.5 px-6">{getTypeBadge(col.type)}</td>
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-500 bg-slate-50/40">{col.sample ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}