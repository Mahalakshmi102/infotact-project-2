import React, { useState, useMemo } from 'react';
import { List } from 'react-window';
import { Search, Eye, Table, ArrowUpDown } from 'lucide-react';

/**
 * Virtual Grid using react-window to display 1,000+ preview rows
 * with 60 FPS rendering and zero DOM lag.
 */
export default function VirtualGrid({ rows = [], headers = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);

    // Filter rows based on search input
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const term = searchTerm.toLowerCase();
        return rows.filter(row => {
            return Object.values(row).some(val => 
                String(val).toLowerCase().includes(term)
            );
        });
    }, [rows, searchTerm]);

    const displayHeaders = useMemo(() => {
        if (headers && headers.length > 0) return headers;
        if (rows && rows.length > 0) return Object.keys(rows[0]);
        return [];
    }, [headers, rows]);

    // Calculate fixed column width for horizontal scrolling
    const columnWidth = 180;
    const totalTableWidth = Math.max(displayHeaders.length * columnWidth + 80, 800);

    // Row renderer for react-window v2
    const Row = ({ index, style }) => {
        const row = filteredRows[index];
        if (!row) return null;
        const isSelected = selectedRow === index;

        return (
            <div
                style={style}
                onClick={() => setSelectedRow(isSelected ? null : index)}
                className={`flex items-center border-b border-slate-800/80 text-xs font-mono transition-colors cursor-pointer hover:bg-indigo-950/40 ${
                    index % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-900/30'
                } ${isSelected ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-200' : 'text-slate-300'}`}
            >
                {/* Fixed Row Index */}
                <div className="w-20 min-w-[5rem] px-3 py-2 text-slate-500 font-semibold border-r border-slate-800 flex items-center justify-between">
                    <span>#{index + 1}</span>
                </div>

                {/* Column Values */}
                {displayHeaders.map((header) => {
                    const cellVal = row[header];
                    const isNull = cellVal === undefined || cellVal === null || cellVal === '';
                    return (
                        <div
                            key={header}
                            style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                            className="px-4 py-2 truncate border-r border-slate-800/50"
                            title={String(cellVal ?? '')}
                        >
                            {isNull ? (
                                <span className="text-slate-600 italic">null</span>
                            ) : (
                                <span>{String(cellVal)}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!rows || rows.length === 0) {
        return (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400">
                <Table className="mx-auto w-10 h-10 mb-2 text-slate-600" />
                <p>No preview rows available. Upload a dataset to inspect.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Control Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                        <Table size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                            Virtualized Dataset Preview
                            <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 font-mono">
                                60 FPS Virtual Grid
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                            Rendering first <span className="text-indigo-300 font-medium">{rows.length.toLocaleString()}</span> rows in memory-safe virtualized viewport ({displayHeaders.length} columns)
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filter preview rows..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-950/70 border border-slate-700/80 text-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500 transition-colors w-64"
                        />
                    </div>
                    {searchTerm && (
                        <span className="text-xs text-slate-400 font-mono">
                            {filteredRows.length} matches
                        </span>
                    )}
                </div>
            </div>

            {/* Scrollable Container with Horizontal Overflow */}
            <div className="overflow-x-auto">
                <div style={{ width: `${totalTableWidth}px` }}>
                    {/* Sticky Table Header */}
                    <div className="flex bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                        <div className="w-20 min-w-[5rem] px-3 py-3 border-r border-slate-800 text-slate-500">
                            Index
                        </div>
                        {displayHeaders.map((header) => (
                            <div
                                key={header}
                                style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                                className="px-4 py-3 border-r border-slate-800/70 truncate flex items-center justify-between text-slate-300 font-mono"
                                title={header}
                            >
                                <span className="truncate">{header}</span>
                                <ArrowUpDown size={12} className="text-slate-600 opacity-60 flex-shrink-0 ml-1" />
                            </div>
                        ))}
                    </div>

                    {/* Virtualized Rows List (react-window v2) */}
                    <List
                        rowCount={filteredRows.length}
                        rowHeight={38}
                        rowComponent={Row}
                        rowProps={{}}
                        style={{ height: 380, width: totalTableWidth }}
                    />
                </div>
            </div>

            {/* Footer with Row Details if selected */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>DOM Virtualization Active — Only visible rows rendered to protect browser RAM</span>
                </div>
                {selectedRow !== null && filteredRows[selectedRow] && (
                    <div className="text-indigo-400 font-mono flex items-center gap-2">
                        <Eye size={12} />
                        Row #{selectedRow + 1} inspected
                    </div>
                )}
            </div>
        </div>
    );
}
