import { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Search 
} from 'lucide-react';
import axios from 'axios';

export default function Datasets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock initial dataset for UI demonstration matching Hari's Day 3 Dataset Schema
  const [datasets, setDatasets] = useState([
    {
      _id: '1',
      fileName: 'customer_transactions_large.csv',
      fileSize: 2147483648, // 2GB
      fileType: 'csv',
      totalRows: 5000000,
      status: 'Completed',
      createdAt: '2026-09-21T10:30:00Z',
    },
    {
      _id: '2',
      fileName: 'telemetry_stream_log.json',
      fileSize: 524288000, // 500MB
      fileType: 'json',
      totalRows: 1250000,
      status: 'Processing',
      createdAt: '2026-09-21T11:45:00Z',
    },
    {
      _id: '3',
      fileName: 'users_master_dump.csv',
      fileSize: 104857600, // 100MB
      fileType: 'csv',
      totalRows: 250000,
      status: 'Uploaded',
      createdAt: '2026-09-21T12:15:00Z',
    },
    {
      _id: '4',
      fileName: 'corrupted_sales_archive.csv',
      fileSize: 45097152, // ~43MB
      fileType: 'csv',
      totalRows: 0,
      status: 'Failed',
      createdAt: '2026-09-21T12:40:00Z',
    },
  ]);

  // Fetch real datasets from backend if running
  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/datasets');
      if (response.data && Array.isArray(response.data)) {
        setDatasets(response.data);
      }
    } catch (error) {
      // Backend integration pending; keeping mock data active
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Status badge matching Day 4 requirements
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Uploaded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock size={14} />
            Uploaded
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Loader2 size={14} className="animate-spin" />
            Processing
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={14} />
            Completed
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={14} />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const filteredDatasets = datasets.filter((item) =>
    item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dataset Collections</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor ingested files and stream processing pipeline statuses
          </p>
        </div>
        <button
          onClick={fetchDatasets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search datasets by file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredDatasets.length}</span> datasets
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">File Name</th>
                <th className="py-3.5 px-6">Format</th>
                <th className="py-3.5 px-6">File Size</th>
                <th className="py-3.5 px-6">Total Rows</th>
                <th className="py-3.5 px-6">Uploaded At</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {filteredDatasets.length > 0 ? (
                filteredDatasets.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <FileSpreadsheet size={18} />
                      </div>
                      <span className="truncate max-w-xs">{item.fileName}</span>
                    </td>
                    <td className="py-4 px-6 uppercase text-xs font-semibold text-slate-500">
                      {item.fileType}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{formatFileSize(item.fileSize)}</td>
                    <td className="py-4 px-6 text-slate-600">
                      {item.totalRows > 0 ? item.totalRows.toLocaleString() : '—'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{formatDate(item.createdAt)}</td>
                    <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Database size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No datasets found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}