import React, { useState } from 'react';
import { ArrowRight, Code2, Play, CheckCircle2, AlertCircle, ShieldCheck, Database, Layers, Sparkles } from 'lucide-react';
import api from '../services/api';

/**
 * Visual Mapping Builder allowing users to map source columns to
 * destination MongoDB fields and apply sandboxed JavaScript rules via isolated-vm.
 */
export default function VisualMappingBuilder({ headers = [], sampleRow = {}, onSave, isSubmitting = false }) {
    const [targetCollection, setTargetCollection] = useState('etl_records_' + Date.now().toString().slice(-4));
    const [batchSize, setBatchSize] = useState(5000);

    // Initial mappings based on detected headers
    const [mappings, setMappings] = useState(() => {
        return headers.map(header => {
            // Auto-clean suggested mongo field name
            const cleanField = header.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
            return {
                sourceField: header,
                targetField: cleanField,
                targetType: 'string',
                transformType: 'direct',
                customJs: 'return value ? value.toUpperCase() : "";',
                validation: {
                    required: false,
                    notEmpty: false,
                    isEmail: header.toLowerCase().includes('email'),
                    min: '',
                    max: '',
                    regexPattern: ''
                }
            };
        });
    });

    const [testingField, setTestingField] = useState(null);
    const [testResults, setTestResults] = useState({});

    const handleFieldChange = (index, key, value) => {
        setMappings(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [key]: value };
            return next;
        });
    };

    const handleValidationChange = (index, key, value) => {
        setMappings(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                validation: { ...next[index].validation, [key]: value }
            };
            return next;
        });
    };

    // Test custom JS in the isolated-vm backend sandbox
    const handleTestSandbox = async (sourceField, customJs) => {
        setTestingField(sourceField);
        const sampleVal = sampleRow[sourceField] ?? 'sample value';

        try {
            const res = await api.post('/etl/test-sandbox', {
                code: customJs,
                sampleValue: sampleVal,
                sampleRow
            });

            setTestResults(prev => ({
                ...prev,
                [sourceField]: res.data
            }));
        } catch (err) {
            setTestResults(prev => ({
                ...prev,
                [sourceField]: {
                    success: false,
                    error: err.response?.data?.error || err.message
                }
            }));
        } finally {
            setTestingField(null);
        }
    };

    const handleSubmit = () => {
        if (!targetCollection.trim()) {
            alert('Please specify a destination MongoDB collection name.');
            return;
        }
        onSave({
            targetCollection,
            batchSize: Number(batchSize),
            mappings: mappings.filter(m => m.targetType !== 'skip')
        });
    };

    return (
        <div className="space-y-6">
            {/* Target Destination & Bulk Options Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Database size={15} className="text-indigo-400" />
                            Target MongoDB Destination Collection
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={targetCollection}
                                onChange={(e) => setTargetCollection(e.target.value)}
                                placeholder="e.g. processed_customers"
                                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                            Cleaned records will be stream-ingested directly into this collection.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Layers size={15} className="text-indigo-400" />
                            MongoDB bulkWrite Buffer Size
                        </label>
                        <select
                            value={batchSize}
                            onChange={(e) => setBatchSize(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                        >
                            <option value={1000}>1,000 records / batch</option>
                            <option value={2500}>2,500 records / batch</option>
                            <option value={5000}>5,000 records / batch (Standard Specification)</option>
                            <option value={10000}>10,000 records / batch (Maximum Throughput)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1.5">
                            Buffer flushes every 5,000 records with backpressure to prevent V8 memory exhaustion.
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Column Mappings Cards */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-400" />
                        Column Transformation & Schema Mapping ({mappings.length} columns)
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span>isolated-vm V8 Sandbox Guard Active</span>
                    </div>
                </div>

                {mappings.map((mapping, idx) => {
                    const sampleVal = sampleRow[mapping.sourceField];
                    const testResult = testResults[mapping.sourceField];

                    return (
                        <div
                            key={mapping.sourceField}
                            className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg"
                        >
                            {/* Main Mapping Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                {/* Source Column */}
                                <div className="lg:col-span-3">
                                    <div className="text-xs text-slate-500 mb-1">Source Column</div>
                                    <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                                        <div className="font-semibold text-slate-200 text-sm truncate font-mono">
                                            {mapping.sourceField}
                                        </div>
                                        <div className="text-xs text-slate-400 truncate mt-0.5">
                                            Sample: <span className="text-indigo-300 font-mono">{String(sampleVal ?? 'null')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Arrow Indicator */}
                                <div className="hidden lg:flex lg:col-span-1 justify-center text-slate-600">
                                    <ArrowRight size={20} className="text-indigo-400/80" />
                                </div>

                                {/* Target MongoDB Field */}
                                <div className="lg:col-span-3">
                                    <div className="text-xs text-slate-500 mb-1">MongoDB Field</div>
                                    <input
                                        type="text"
                                        value={mapping.targetField}
                                        onChange={(e) => handleFieldChange(idx, 'targetField', e.target.value)}
                                        placeholder="target_field_name"
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {/* Target Data Type */}
                                <div className="lg:col-span-2">
                                    <div className="text-xs text-slate-500 mb-1">Target Type</div>
                                    <select
                                        value={mapping.targetType}
                                        onChange={(e) => handleFieldChange(idx, 'targetType', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="string">String</option>
                                        <option value="number">Number</option>
                                        <option value="boolean">Boolean</option>
                                        <option value="date">Date</option>
                                        <option value="json">JSON / Object</option>
                                        <option value="skip">❌ Skip / Drop</option>
                                    </select>
                                </div>

                                {/* Transform Mode */}
                                <div className="lg:col-span-3">
                                    <div className="text-xs text-slate-500 mb-1">Transformation Rule</div>
                                    <select
                                        value={mapping.transformType}
                                        onChange={(e) => handleFieldChange(idx, 'transformType', e.target.value)}
                                        className={`w-full bg-slate-950 border text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-indigo-500 ${
                                            mapping.transformType === 'custom_js' ? 'border-indigo-500 text-indigo-300' : 'border-slate-700'
                                        }`}
                                    >
                                        <option value="direct">Direct (Pass through)</option>
                                        <option value="trim">Trim Whitespace</option>
                                        <option value="uppercase">UPPERCASE</option>
                                        <option value="lowercase">lowercase</option>
                                        <option value="round">Round Number (2 dec)</option>
                                        <option value="custom_js">⚡ Custom JS (isolated-vm Sandbox)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Custom JS Code Editor (shown when custom_js is selected) */}
                            {mapping.transformType === 'custom_js' && (
                                <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/90 rounded-xl p-4 border border-indigo-900/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                                            <Code2 size={15} />
                                            <span>Secure V8 Sandbox Transformation Code (Node.js isolated-vm)</span>
                                        </div>
                                        {/* Quick Snippets */}
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span className="text-slate-500">Snippets:</span>
                                            <button
                                                type="button"
                                                onClick={() => handleFieldChange(idx, 'customJs', 'return value ? value.toUpperCase() : "";')}
                                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                            >
                                                UpperCase
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFieldChange(idx, 'customJs', 'return value ? value.trim() : "";')}
                                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                            >
                                                Trim
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFieldChange(idx, 'customJs', 'return Number(value) * 1.18;')}
                                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                            >
                                                GST 18%
                                            </button>
                                        </div>
                                    </div>

                                    <textarea
                                        rows={3}
                                        value={mapping.customJs}
                                        onChange={(e) => handleFieldChange(idx, 'customJs', e.target.value)}
                                        placeholder="// Write inline JS: return value.toUpperCase();"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                                    />

                                    {/* Action to test in isolated-vm sandbox */}
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            disabled={testingField === mapping.sourceField}
                                            onClick={() => handleTestSandbox(mapping.sourceField, mapping.customJs)}
                                            className="flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <Play size={12} className={testingField === mapping.sourceField ? 'animate-spin' : ''} />
                                            {testingField === mapping.sourceField ? 'Executing in Sandbox...' : 'Test in isolated-vm Sandbox'}
                                        </button>

                                        {testResult && (
                                            <div className="flex items-center gap-2 text-xs">
                                                {testResult.success ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg font-mono">
                                                        <CheckCircle2 size={13} />
                                                        Output: "{String(testResult.output)}" ({testResult.durationMs}ms)
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1 rounded-lg font-mono">
                                                        <AlertCircle size={13} />
                                                        Error: {testResult.error}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Validation Rules Expandable Row */}
                            <div className="mt-3 pt-3 border-t border-slate-800/50 flex flex-wrap items-center gap-4 text-xs">
                                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                    Validations:
                                </span>
                                <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={mapping.validation.required}
                                        onChange={(e) => handleValidationChange(idx, 'required', e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
                                    />
                                    <span>Required</span>
                                </label>
                                <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={mapping.validation.isEmail}
                                        onChange={(e) => handleValidationChange(idx, 'isEmail', e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
                                    />
                                    <span>Must be Email</span>
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">Min:</span>
                                    <input
                                        type="number"
                                        value={mapping.validation.min}
                                        onChange={(e) => handleValidationChange(idx, 'min', e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="-"
                                        className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">Max:</span>
                                    <input
                                        type="number"
                                        value={mapping.validation.max}
                                        onChange={(e) => handleValidationChange(idx, 'max', e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="-"
                                        className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Launch Ingestion Button */}
            <div className="pt-4 flex justify-end">
                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm disabled:opacity-50"
                >
                    <Layers size={18} />
                    <span>{isSubmitting ? 'Starting Stream Ingestion...' : 'Execute High-Throughput ETL Stream'}</span>
                </button>
            </div>
        </div>
    );
}
