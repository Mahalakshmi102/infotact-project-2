import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Settings2, FileOutput } from 'lucide-react';

// 1. Input Node (CSV / JSON Source)
export function InputNode({ data }) {
  return (
    <div className="bg-white border-2 border-indigo-500 rounded-xl p-3 shadow-md w-52">
      <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs border-b border-indigo-100 pb-2">
        <Database size={16} />
        <span>Source: {data.label || 'Dataset'}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 font-mono">{data.file || 'customer_data.csv'}</p>
      
      {/* Output handle to connect to next node */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-600 border-2 border-white rounded-full"
      />
    </div>
  );
}

// 2. Transformation Node (Uppercase, Trim, Filter etc.)
export function TransformNode({ data }) {
  return (
    <div className="bg-white border-2 border-amber-500 rounded-xl p-3 shadow-md w-56">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-amber-600 border-2 border-white rounded-full"
      />
      <div className="flex items-center justify-between text-amber-700 font-semibold text-xs border-b border-amber-100 pb-2">
        <div className="flex items-center gap-1.5">
          <Settings2 size={16} />
          <span>Transform</span>
        </div>
        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono uppercase">
          {data.operation || 'Uppercase'}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">Field: <span className="font-semibold text-slate-700">{data.field || 'customer_name'}</span></p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-amber-600 border-2 border-white rounded-full"
      />
    </div>
  );
}

// 3. Output Node (MongoDB / Export Destination)
export function OutputNode({ data }) {
  return (
    <div className="bg-white border-2 border-emerald-500 rounded-xl p-3 shadow-md w-52">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-emerald-600 border-2 border-white rounded-full"
      />
      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs border-b border-emerald-100 pb-2">
        <FileOutput size={16} />
        <span>Destination: {data.label || 'MongoDB'}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 font-mono">Collection: {data.target || 'users_cleaned'}</p>
    </div>
  );
}