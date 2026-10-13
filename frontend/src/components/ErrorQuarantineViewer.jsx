import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle, Eye } from 'lucide-react';
import api from '../services/api';

/**
 * Error-Handling UI Layer: highlights rows that failed validation
 * or sandboxed JS execution during the streaming ETL process.
 */
export default function ErrorQuarantineViewer({ jobId }) {
    const [errors, setErrors] = useState([]);
    const [totalErrors, setTotalErrors] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        if (!jobId) return;
        const fetchErrors = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/etl/jobs/${jobId}/errors?page=${page}&limit=20`);
                setErrors(res.data.errors || []);
                setTotalErrors(res.data.total || 0);
                setTotalPages(res.data.totalPages || 1);
            } catch (err) {
                console.error('Error fetching quarantined rows:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchErrors();
    }, [jobId, page]);

    const handleExportJson = () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(errors, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `quarantined_rows_job_${jobId}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    if (totalErrors === 0 && !loading) {
        return (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
                <CheckCircle className="mx-auto w-12 h-12 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-slate-200 text-base">Zero Validation Errors</h3>
                <p className="text-xs text-slate-400 mt-1">
                    All streamed rows successfully satisfied validation rules and schema transformations.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm space-y-4 p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            Quarantined Rows & Validation Failures
                            <span className="px-2 py-0.5 text-xs bg-rose-950 text-rose-300 rounded-full border border-rose-800 font-mono">
                                {totalErrors.toLocaleString()} failed rows
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Rows excluded from database ingestion due to schema validation or sandbox rule failure.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleExportJson}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
                >
                    <Download size={14} />
                    <span>Export Quarantined Data (JSON)</span>
                </button>
            </div>

            {/* Error Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                            <tr>
                                <th className="px-4 py-3">Row #</th>
                                <th className="px-4 py-3">Failed Column</th>
                                <th className="px-4 py-3">Failed Rule</th>
                                <th className="px-4 py-3">Error Reason</th>
                                <th className="px-4 py-3">Raw Value</th>
                                <th className="px-4 py-3 text-right">Inspect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                        Loading quarantined records...
                                    </td>
                                </tr>
                            ) : errors.map((item) => {
                                const firstError = item.errors?.[0] || {};
                                return (
                                    <tr
                                        key={item._id}
                                        className="hover:bg-rose-950/20 transition-colors cursor-pointer"
                                        onClick={() => setSelectedRow(selectedRow === item._id ? null : item._id)}
                                    >
                                        <td className="px-4 py-3 font-bold text-slate-300">
                                            #{item.rowIndex}
                                        </td>
                                        <td className="px-4 py-3 text-indigo-300 font-semibold">
                                            {firstError.field || 'General'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-rose-900/40 text-rose-300 border border-rose-800/60 rounded text-[10px]">
                                                {firstError.rule || 'validation'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-rose-300">
                                            {firstError.message}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 truncate max-w-xs">
                                            {String(firstError.value ?? 'null')}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-400">
                                            <Eye size={14} className="inline text-slate-500 hover:text-slate-300" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center space-x-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                            className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
