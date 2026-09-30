import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { InputNode, TransformNode, OutputNode } from '../components/nodes/CustomNodes';
import { Database, Settings2, FileOutput, Play, Save, CheckCircle2 } from 'lucide-react';

export default function PipelineBuilder() {
  const nodeTypes = useMemo(() => ({
    inputNode: InputNode,
    transformNode: TransformNode,
    outputNode: OutputNode,
  }), []);

  // Initial Pre-configured Pipeline Nodes
  const initialNodes = [
    {
      id: 'node-1',
      type: 'inputNode',
      position: { x: 50, y: 150 },
      data: { label: 'CSV Ingestion', file: 'customer_transactions.csv' },
    },
    {
      id: 'node-2',
      type: 'transformNode',
      position: { x: 340, y: 80 },
      data: { operation: 'UPPERCASE', field: 'customer_name' },
    },
    {
      id: 'node-3',
      type: 'transformNode',
      position: { x: 340, y: 220 },
      data: { operation: 'TRIM', field: 'email' },
    },
    {
      id: 'node-4',
      type: 'outputNode',
      position: { x: 650, y: 150 },
      data: { label: 'MongoDB Load', target: 'analytics_dump' },
    },
  ];

  const initialEdges = [
    { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
    { id: 'e1-3', source: 'node-1', target: 'node-3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
    { id: 'e2-4', source: 'node-2', target: 'node-4', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
    { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
  ];

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  // Add new nodes dynamically
  const addNode = (type, label, extra = {}) => {
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 250 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: { label, ...extra },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Visual No-Code Pipeline Builder</h1>
          <p className="text-xs text-slate-500">Drag, drop and connect transformation nodes with stream handles</p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 size={15} /> Pipeline Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Save size={15} /> Save Pipeline
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Palette */}
        <div className="w-60 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm shrink-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Node Palette</p>
          <p className="text-[11px] text-slate-400">Click to place new stage into canvas</p>

          <button
            onClick={() => addNode('inputNode', 'Dataset Stream', { file: 'source_feed.json' })}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition text-left"
          >
            <Database size={16} />
            <span>+ Add Input Node</span>
          </button>

          <button
            onClick={() => addNode('transformNode', 'Transform Stage', { operation: 'LOWERCASE', field: 'email' })}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium transition text-left"
          >
            <Settings2 size={16} />
            <span>+ Add Transform Node</span>
          </button>

          <button
            onClick={() => addNode('outputNode', 'Database Sink', { target: 'analytics_clean' })}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition text-left"
          >
            <FileOutput size={16} />
            <span>+ Add Output Node</span>
          </button>

          <div className="mt-auto p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 block mb-1">Tip:</span>
            Drag from right blue/amber handle and drop onto left handle of another node to connect.
          </div>
        </div>

        {/* Canvas Area */}
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