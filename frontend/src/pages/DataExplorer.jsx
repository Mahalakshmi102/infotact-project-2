import React, { useState, useEffect } from 'react';
import { Database, Search, Table, RefreshCw, ChevronLeft, ChevronRight, FileJson, ArrowRight } from 'lucide-react';
import api from '../services/api';

/**
 * Data Explorer: View and browse destination MongoDB collections
 * created and populated by the StreamWeaver ETL streaming pipeline.
 */
export default function DataExplorer() {
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [documents, setDocuments] = useState([]);
    const [totalDocs, setTotalDocs] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // Fetch list of collections
    const fetchCollections = async () => {
        try {
            const res = await api.get('/etl/collections');
            setCollections(res.data || []);
            if (res.data?.length > 0 && !selectedCollection) {
                // Select first collection by default
                setSelectedCollection(res.data[0].name);
            }
        } catch (err) {
            console.error('Failed to fetch collections:', err);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    // Fetch documents when selectedCollection or page changes
    useEffect(() => {
        if (!selectedCollection) return;

        const fetchDocs = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/etl/collections/${selectedCollection}/data?page=${page}&limit=15`);
                setDocuments(res.data.documents || []);
                setTotalDocs(res.data.total || 0);
                setTotalPages(res.data.totalPages || 1);
            } catch (err) {
                console.error('Failed to fetch collection documents:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [selectedCollection, page]);

    // Extract headers for table
    const tableHeaders = documents.length > 0
        ? Object.keys(documents[0]).filter(k => k !== '__v')
        : [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-3">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                            MongoDB Collection Explorer
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full font-mono">
                            Live Database Inspector
                        </span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Inspect target collections populated by StreamWeaver bulkWrite streaming pipelines.
                    </p>
                </div>

                <button
                    onClick={fetchCollections}
                    className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-800 transition-colors"
                >
                    <RefreshCw size={14} />
                    <span>Refresh Collections</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Collections List Sidebar */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-2">
                        <Database size={14} className="text-indigo-400" />
                        Available Collections ({collections.length})
                    </h3>

                    <div className="space-y-1 max-h-[500px] overflow-y-auto">
                        {collections.map(col => (
                            <button
                                key={col.name}
                                onClick={() => {
                                    setSelectedCollection(col.name);
                                    setPage(1);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                                    selectedCollection === col.name
                                        ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                                        : 'text-slate-300 hover:bg-slate-800/60'
                                }`}
                            >
                                <span className="truncate">{col.name}</span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                                    selectedCollection === col.name ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {col.count?.toLocaleString()}
                                </span>
                            </button>
                        ))}

                        {collections.length === 0 && (
                            <p className="text-xs text-slate-500 px-2 py-4 text-center">
                                No collections found in MongoDB yet.
                            </p>
                        )}
                    </div>
                </div>

                {/* Documents Grid / Table */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="font-bold text-slate-200 text-sm font-mono flex items-center gap-2">
                                    <Table size={16} className="text-indigo-400" />
                                    {selectedCollection || 'No collection selected'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Total Records Ingested: <strong className="text-indigo-300">{totalDocs.toLocaleString()}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border border-slate-800 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                                        <tr>
                                            {tableHeaders.slice(0, 6).map(header => (
                                                <th key={header} className="px-4 py-3">
                                                    {header}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right">View JSON</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={tableHeaders.length + 1} className="px-4 py-8 text-center text-slate-500">
                                                    Loading documents from MongoDB...
                                                </td>
                                            </tr>
                                        ) : documents.map((doc, idx) => (
                                            <tr key={doc._id || idx} className="hover:bg-slate-800/40 transition-colors">
                                                {tableHeaders.slice(0, 6).map(header => {
                                                    const val = doc[header];
                                                    return (
                                                        <td key={header} className="px-4 py-3 truncate max-w-[200px] text-slate-300">
                                                            {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => setSelectedDoc(doc)}
                                                        className="text-indigo-400 hover:text-indigo-300 text-xs inline-flex items-center gap-1"
                                                    >
                                                        <FileJson size={13} />
                                                        <span>Inspect</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {documents.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                    No documents found in this collection.
                                                </td>
                                            </tr>
                                        )}
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

                    {/* JSON Modal / Drawer if selected */}
                    {selectedDoc && (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-slate-200 text-xs font-mono flex items-center gap-2">
                                    <FileJson size={14} className="text-indigo-400" />
                                    Document Details (ID: {selectedDoc._id})
                                </h4>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="text-slate-400 hover:text-slate-200 text-xs"
                                >
                                    ✕ Close
                                </button>
                            </div>
                            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-emerald-300 font-mono overflow-x-auto max-h-60">
                                {JSON.stringify(selectedDoc, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
