import React, { useState } from 'react';
import { UploadCloud, FileText, ArrowRight, CheckCircle2, Layers, Cpu, ShieldCheck, Database, RefreshCw, Zap } from 'lucide-react';
import api from '../services/api';
import VirtualGrid from '../components/VirtualGrid';
import VisualMappingBuilder from '../components/VisualMappingBuilder';
import LiveProgressMonitor from '../components/LiveProgressMonitor';
import ErrorQuarantineViewer from '../components/ErrorQuarantineViewer';

/**
 * StreamWeaver High-Throughput No-Code ETL Studio
 * Implements Week 1 (busboy stream + react-window virtual grid),
 * Week 2 (Visual Mapping UI + stream.Transform),
 * Week 3 (isolated-vm Sandbox + WebSocket Live Progress),
 * and Week 4 (5,000 MongoDB bulkWrite buffer + Error Quarantine UI layer).
 */
export default function Upload() {
    const [step, setStep] = useState(1); // 1: Upload & Preview, 2: Mapping, 3: Live Ingestion, 4: Results & Errors
    const [file, setFile] = useState(null);
    const [isStreamingUpload, setIsStreamingUpload] = useState(false);
    const [uploadProgressMsg, setUploadProgressMsg] = useState('');
    const [datasetData, setDatasetData] = useState(null);
    const [activeJobId, setActiveJobId] = useState(null);
    const [activeTargetCollection, setActiveTargetCollection] = useState('');
    const [etlFinishedData, setEtlFinishedData] = useState(null);

    // Step 1: Handle File Selection & Multipart Busboy Streaming Preview
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleStreamPreview = async () => {
        if (!file) return;
        setIsStreamingUpload(true);
        setUploadProgressMsg('Streaming file chunk-by-chunk via busboy to extract 1,000-row virtual preview...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/etl/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setDatasetData(res.data.dataset);
            setUploadProgressMsg('');
            // Move to Step 2: Visual Mapping
            setStep(2);
        } catch (err) {
            console.error('Upload preview failed:', err);
            setUploadProgressMsg('Streaming preview failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsStreamingUpload(false);
        }
    };

    // Step 2: Handle Submitting Mapping and Starting Stream Ingestion
    const handleStartEtl = async ({ targetCollection, batchSize, mappings }) => {
        if (!datasetData) return;

        try {
            setActiveTargetCollection(targetCollection);
            const res = await api.post('/etl/execute', {
                datasetId: datasetData.id,
                targetCollection,
                batchSize,
                mappings
            });

            setActiveJobId(res.data.jobId);
            setStep(3); // Move to Step 3: Live Progress WebSocket Monitor
        } catch (err) {
            alert('Failed to initiate ETL stream: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-3">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                            StreamWeaver ETL Pipeline Studio
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full font-mono">
                            Memory-Safe &lt;150MB
                        </span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        High-throughput stream-processing architecture for gigabyte datasets without memory crashes.
                    </p>
                </div>

                {/* Step Breadcrumbs */}
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs font-medium">
                    <span className={`px-3 py-1 rounded-lg ${step === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                        1. Stream & Preview
                    </span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className={`px-3 py-1 rounded-lg ${step === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                        2. Visual Mapping & Sandbox
                    </span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className={`px-3 py-1 rounded-lg ${step === 3 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                        3. Live Stream Ingest
                    </span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className={`px-3 py-1 rounded-lg ${step === 4 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                        4. Error Quarantine
                    </span>
                </div>
            </div>

            {/* STEP 1: Multipart File Streaming & Virtualized Preview */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                        <div className="max-w-2xl mx-auto text-center space-y-6">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center text-indigo-400">
                                <UploadCloud size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-100">
                                    Upload & Stream Massive Dataset
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Upload CSV or JSON files (up to multi-GB). Uses native <code className="text-indigo-300">busboy</code> streams to bypass RAM limitations.
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 transition-colors bg-slate-950/60">
                                <input
                                    type="file"
                                    id="etl-file-input"
                                    accept=".csv,.json"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="etl-file-input"
                                    className="cursor-pointer flex flex-col items-center space-y-3"
                                >
                                    <FileText size={40} className="text-indigo-400/80" />
                                    <div>
                                        <span className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all inline-block">
                                            Choose CSV or JSON File
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        Piped directly via chunked streams — Zero heap accumulation
                                    </span>
                                </label>

                                {file && (
                                    <div className="mt-6 pt-4 border-t border-slate-800 text-left bg-slate-900/90 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-200 text-sm font-mono">{file.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                Size: <strong className="text-indigo-300">{(file.size / 1024 / 1024).toFixed(2)} MB</strong> | Type: {file.type || 'text/csv'}
                                            </div>
                                        </div>
                                        <div className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                                            <CheckCircle2 size={14} /> Ready to stream
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!file || isStreamingUpload}
                                onClick={handleStreamPreview}
                                className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                <Zap size={18} />
                                <span>{isStreamingUpload ? 'Streaming & Parsing...' : 'Stream & Generate 1,000-Row Virtual Preview'}</span>
                            </button>

                            {uploadProgressMsg && (
                                <p className="text-xs text-indigo-300 font-mono animate-pulse">
                                    {uploadProgressMsg}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: Virtual Preview Grid & Visual Mapping Builder */}
            {step === 2 && datasetData && (
                <div className="space-y-8">
                    {/* File Meta Summary */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-200 text-sm">{datasetData.fileName}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-400">Size: <strong className="text-slate-200">{(datasetData.fileSize / 1024 / 1024).toFixed(2)} MB</strong></span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-400">Columns: <strong className="text-indigo-300">{datasetData.headers?.length}</strong></span>
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="text-slate-400 hover:text-slate-200 underline text-xs"
                        >
                            Change Dataset
                        </button>
                    </div>

                    {/* Week 1 & Mid-Project Review: 1,000-Row Virtual Grid (react-window) */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                <Layers size={18} className="text-indigo-400" />
                                Week 1 & Mid-Project Review: Virtualized Preview Grid
                            </h2>
                            <span className="text-xs text-slate-400">
                                DOM Virtualization ensures 60 FPS scrolling for 1,000+ rows
                            </span>
                        </div>
                        <VirtualGrid
                            rows={datasetData.previewRows}
                            headers={datasetData.headers}
                        />
                    </div>

                    {/* Week 2 & Week 3: Visual Mapping UI & isolated-vm Sandbox Builder */}
                    <div className="pt-4 border-t border-slate-800">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                <Database size={18} className="text-indigo-400" />
                                Week 2 & 3: Visual Column Mapping & Sandboxed JS Rules
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Map source columns to target MongoDB fields, configure types, and write inline JavaScript executed securely in V8 sandboxes.
                            </p>
                        </div>
                        <VisualMappingBuilder
                            headers={datasetData.headers}
                            sampleRow={datasetData.previewRows?.[0] || {}}
                            onSave={handleStartEtl}
                        />
                    </div>
                </div>
            )}

            {/* STEP 3: Real-Time Stream Ingestion & WebSocket Monitor */}
            {step === 3 && activeJobId && (
                <div className="space-y-6">
                    <LiveProgressMonitor
                        jobId={activeJobId}
                        targetCollection={activeTargetCollection}
                        onComplete={(data) => {
                            setEtlFinishedData(data);
                            if (data.quarantinedRows > 0) {
                                // Auto allow inspecting errors
                            }
                        }}
                        onInspectErrors={() => setStep(4)}
                    />
                </div>
            )}

            {/* STEP 4: Week 4 Refine & Polish Error-Handling UI Layer */}
            {step === 4 && activeJobId && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setStep(3)}
                            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                        >
                            &larr; Back to Ingestion Monitor
                        </button>
                    </div>
                    <ErrorQuarantineViewer jobId={activeJobId} />
                </div>
            )}
        </div>
    );
}