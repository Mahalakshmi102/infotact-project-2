import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Folder path ko 'nodes' subfolder ke hisaab se update kiya gaya hai
import { InputNode, TransformNode, OutputNode } from '../components/nodes/CustomNodes';
import { Database, Sparkles, Server, Save, CheckCircle2, Play, Plus, ArrowRight } from 'lucide-react';

export default function PipelineBuilder() {
  const navigate = useNavigate();

  const nodeTypes = useMemo(() => ({
    inputNode: InputNode,
    transformNode: TransformNode,
    outputNode: OutputNode,
  }), []);

  const initialNodes = [
    {
      id: 'source-1',
      type: 'inputNode',
      position: { x: 50, y: 140 },
      data: { label: 'customer_transactions.csv', format: 'CSV Stream' },
    },
    {
      id: 'transform-1',
      type: 'transformNode',
      position: { x: 340, y: 60 },
      data: { operation: 'UPPERCASE', field: 'customer_name' },
    },
    {
      id: 'transform-2',
      type: 'transformNode',
      position: { x: 340, y: 220 },
      data: { operation: 'TRIM', field: 'email' },
    },
    {
      id: 'dest-1',
      type: 'outputNode',
      position: { x: 670, y: 140 },
      data: { label: 'MongoDB Sink', target: 'cleaned_customers' },
    },
  ];

  const initialEdges = [
    { id: 'e1-2', source: 'source-1', target: 'transform-1', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
    { id: 'e1-3', source: 'source-1', target: 'transform-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
    { id: 'e2-4', source: 'transform-1', target: 'dest-1', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
    { id: 'e3-4', source: 'transform-2', target: 'dest-1', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
  ];

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)),
    []
  );

  const handleAddNode = (type, customData) => {
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 260 + Math.random() * 80, y: 100 + Math.random() * 120 },
      data: customData,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSavePipeline = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-125px)] flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Visual ETL Pipeline Builder</h1>
          <p className="text-xs text-slate-500">Connect stream nodes to construct transformation graph</p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 size={15} /> Pipeline Saved
            </span>
          )}
          <button
            onClick={handleSavePipeline}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Save size={15} /> Save Pipeline
          </button>
          <button
            onClick={() => navigate('/preview')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Play size={15} /> Test in Preview <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Canvas workspace */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Node selector sidebar */}
        <div className="w-64 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm shrink-0">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Node Palette</p>
          <p className="text-[11px] text-slate-400">Click to add to canvas</p>

          <button
            type="button"
            onClick={() => handleAddNode('inputNode', { label: 'Ingest Source', format: 'CSV / JSON' })}
            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition text-left"
          >
            <Database size={16} />
            <span>+ Add Input Node</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddNode('transformNode', { operation: 'CAPITALIZE', field: 'customer_name' })}
            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition text-left"
          >
            <Sparkles size={16} />
            <span>+ Add Transform Node</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddNode('outputNode', { label: 'MongoDB Load', target: 'analytics_clean' })}
            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition text-left"
          >
            <Server size={16} />
            <span>+ Add Output Node</span>
          </button>

          <div className="mt-auto p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-700">Canvas Controls:</p>
            <p>• Mouse scroll se zoom in / zoom out karein.</p>
            <p>• Left click se node drag karein.</p>
            <p>• Right handle se drag karke left handle par connect karein.</p>
          </div>
        </div>

        {/* React Flow canvas */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={16} size={1} color="#cbd5e1" />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}