import React, { useState } from 'react';
import { 
  ArrowRight, 
  Settings2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Workflow, 
  Play, 
  Layers, 
  Sparkles 
} from 'lucide-react';

export default function PipelineBuilder() {
  // Source columns detected from uploaded dataset
  const sourceColumns = ['transaction_id', 'customer_name', 'email', 'amount', 'created_at', 'status'];

  // Target schema fields required by destination MongoDB collection
  const destinationFields = ['orderId', 'fullName', 'userEmail', 'totalPrice', 'timestamp', 'accountStatus'];

  // Mapping rules state
  const [mappings, setMappings] = useState([
    { source: 'transaction_id', target: 'orderId', transformation: 'trim' },
    { source: 'customer_name', target: 'fullName', transformation: 'uppercase' },
    { source: 'email', target: 'userEmail', transformation: 'lowercase' },
    { source: 'amount', target: 'totalPrice', transformation: 'none' },
    { source: 'created_at', target: 'timestamp', transformation: 'formatDate' },
  ]);

  const [pipelineName, setPipelineName] = useState('Customer Data Ingestion Pipeline');
  const [isSaved, setIsSaved] = useState(false);

  const addMappingRow = () => {
    setMappings([...mappings, { source: '', target: '', transformation: 'none' }]);
  };

  const removeMappingRow = (index) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index, field, value) => {
    const updated = [...mappings];
    updated[index][field] = value;
    setMappings(updated);
    setIsSaved(false);
  };

  const handleSavePipeline = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <Sparkles size={14} /> Week 2 Milestone: ETL Transformation Builder
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">Pipeline & Column Mapping</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Map incoming CSV columns to MongoDB schema and apply transformations without writing scripts
          </p>
        </div>

        <button
          onClick={handleSavePipeline}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Play size={16} /> Save & Compile Pipeline
        </button>
      </div>

      {/* Notification */}
      {isSaved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>Pipeline configuration compiled and ready for stream transform!</span>
        </div>
      )}

      {/* Pipeline Config Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Pipeline Name
          </label>
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <Layers size={14} /> Total Mappings: {mappings.length}
          </span>
          <button
            type="button"
            onClick={addMappingRow}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <Plus size={16} /> Add Field
          </button>
        </div>
      </div>

      {/* Visual Mapping Workspace Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Source to Target Schema Mapping
          </h2>
          <span className="text-xs text-slate-400 font-medium">Node.js stream.Transform ready</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Source Column (CSV)</th>
                <th className="py-3 px-4 text-center"></th>
                <th className="py-3 px-6">Destination Field (MongoDB)</th>
                <th className="py-3 px-6">Transformation Rule</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {mappings.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/70 transition">
                  {/* Source Dropdown */}
                  <td className="py-3.5 px-6">
                    <select
                      value={row.source}
                      onChange={(e) => updateMapping(index, 'source', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Source Field --</option>
                      {sourceColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </td>

                  {/* Flow Arrow */}
                  <td className="py-3.5 px-4 text-center text-slate-400">
                    <ArrowRight size={16} className="mx-auto" />
                  </td>

                  {/* Destination Dropdown */}
                  <td className="py-3.5 px-6">
                    <select
                      value={row.target}
                      onChange={(e) => updateMapping(index, 'target', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Destination Field --</option>
                      {destinationFields.map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </td>

                  {/* Transformation Select */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      <Settings2 size={15} className="text-slate-400 shrink-0" />
                      <select
                        value={row.transformation}
                        onChange={(e) => updateMapping(index, 'transformation', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-indigo-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="none">Direct Pass (No Transform)</option>
                        <option value="uppercase">UPPERCASE (String)</option>
                        <option value="lowercase">lowercase (String)</option>
                        <option value="trim">Trim Whitespace</option>
                        <option value="toNumber">Cast to Number</option>
                        <option value="formatDate">Parse to ISO Date</option>
                      </select>
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td className="py-3.5 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => removeMappingRow(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}