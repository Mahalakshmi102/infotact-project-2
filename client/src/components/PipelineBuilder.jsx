import React, { useState, useEffect } from 'react';
import {
  Play,
  Save,
  Plus,
  Trash2,
  ArrowRight,
  Filter,
  Type,
  Copy,
  Layers,
  CheckCircle,
  AlertCircle,
  Database,
  Grid,
  X,
  RefreshCcw,
} from 'lucide-react';
import { pipelineService } from '../services/api';

const TRANSFORMATION_TYPES = [
  { id: 'filter', label: 'Filter Rows', icon: Filter, description: 'Filter dataset rows by column rules' },
  { id: 'rename', label: 'Rename Column', icon: Type, description: 'Rename an existing dataset column' },
  { id: 'type_cast', label: 'Cast Data Type', icon: Layers, description: 'Convert column to integer/float/date' },
  { id: 'deduplicate', label: 'Deduplicate Rows', icon: Copy, description: 'Remove duplicate rows by columns' },
];

const PipelineBuilder = ({ datasets, onPipelineSaved }) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingSourceId, setConnectingSourceId] = useState(null);

  // Data Preview State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState(null);

  // Current selected dataset metadata
  const currentDataset = datasets.find((d) => d._id === selectedDatasetId);

  // Auto-initialize canvas when dataset changes
  useEffect(() => {
    if (selectedDatasetId && nodes.length === 0) {
      const sourceNode = {
        id: 'node-source-1',
        type: 'source',
        label: currentDataset ? `Source: ${currentDataset.originalName || currentDataset.fileName}` : 'CSV Source',
        position: { x: 50, y: 120 },
        datasetId: selectedDatasetId,
        data: { datasetName: currentDataset?.originalName },
      };

      const destNode = {
        id: 'node-dest-1',
        type: 'destination',
        label: 'Transformed Output',
        position: { x: 650, y: 120 },
        data: {},
      };

      setNodes([sourceNode, destNode]);
      setEdges([{ id: 'edge-source-dest', source: 'node-source-1', target: 'node-dest-1' }]);
    }
  }, [selectedDatasetId]);

  // Add a new transformation node to canvas
  const handleAddTransformationNode = (transType) => {
    if (!selectedDatasetId) {
      setStatusMsg({ type: 'error', text: 'Please select an uploaded Dataset first!' });
      return;
    }

    const newId = `node-trans-${Date.now()}`;
    const defaultConfig = {
      filter: { column: currentDataset?.headers[0] || '', operator: 'equals', value: '' },
      rename: { sourceColumn: currentDataset?.headers[0] || '', targetColumn: '' },
      type_cast: { column: currentDataset?.headers[0] || '', targetType: 'integer' },
      deduplicate: { columns: currentDataset?.headers ? [currentDataset.headers[0]] : [] },
    }[transType] || {};

    const newNode = {
      id: newId,
      type: 'transformation',
      label: `${transType.toUpperCase()} Node`,
      position: { x: 300 + nodes.length * 30, y: 120 },
      data: {
        transformationType: transType,
        config: defaultConfig,
      },
    };

    // Auto connect sequentially in the flow
    setNodes((prev) => [...prev, newNode]);

    // Connect source to this new node, and new node to dest if simple chain
    setEdges((prevEdges) => {
      const filtered = prevEdges.filter((e) => e.target !== 'node-dest-1');
      const lastTransNode = nodes.find((n) => n.id.startsWith('node-trans'));
      const prevSourceId = lastTransNode ? lastTransNode.id : 'node-source-1';

      return [
        ...filtered,
        { id: `edge-${prevSourceId}-${newId}`, source: prevSourceId, target: newId },
        { id: `edge-${newId}-dest`, source: newId, target: 'node-dest-1' },
      ];
    });

    setSelectedNodeId(newId);
    setStatusMsg({ type: 'success', text: `Added ${transType.toUpperCase()} transformation node.` });
  };

  // Update configuration for a selected node
  const handleUpdateNodeConfig = (nodeId, updatedConfig) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              config: { ...n.data.config, ...updatedConfig },
            },
          };
        }
        return n;
      })
    );
  };

  // Delete a node from canvas
  const handleDeleteNode = (nodeId) => {
    if (nodeId.startsWith('node-source') || nodeId.startsWith('node-dest')) return;

    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Build transformationSteps payload array from connected canvas sequence
  const getTransformationStepsFromCanvas = () => {
    const transNodes = nodes.filter((n) => n.type === 'transformation');
    return transNodes.map((n, idx) => ({
      order: idx + 1,
      type: n.data.transformationType,
      config: n.data.config,
    }));
  };

  // Save Pipeline to MongoDB (Day 8 Task)
  const handleSavePipeline = async () => {
    if (!pipelineName.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a Pipeline Name.' });
      return;
    }
    if (!selectedDatasetId) {
      setStatusMsg({ type: 'error', text: 'Please select a Dataset for this Pipeline.' });
      return;
    }

    try {
      const steps = getTransformationStepsFromCanvas();
      const payload = {
        name: pipelineName,
        description: pipelineDescription,
        datasetId: selectedDatasetId,
        nodes,
        edges,
        transformationSteps: steps,
        status: 'active',
      };

      const res = await pipelineService.createPipeline(payload);
      setStatusMsg({ type: 'success', text: `Pipeline "${res.data.name}" saved to MongoDB!` });
      if (onPipelineSaved) onPipelineSaved(res.data);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save pipeline',
      });
    }
  };

  // Run Non-Persistent Data Preview (Day 9 & Day 10 Task)
  const handleRunPreview = async () => {
    if (!selectedDatasetId) {
      setStatusMsg({ type: 'error', text: 'Please select a Dataset to run preview.' });
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);
    setShowPreviewModal(true);

    try {
      const steps = getTransformationStepsFromCanvas();
      const payload = {
        datasetId: selectedDatasetId,
        nodes,
        edges,
        transformationSteps: steps,
      };

      const res = await pipelineService.runPreview(null, payload);
      setPreviewResult(res.data);
    } catch (err) {
      setPreviewError(err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Banner Message */}
      {statusMsg && (
        <div
          className={statusMsg.type === 'success' ? 'alert-success' : 'alert-error'}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header & Dataset Config Controls */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>
              <Grid size={22} color="#3b82f6" />
              No-Code Visual Pipeline Builder
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Drag & drop transformation nodes, connect pipeline steps, save workflow, and preview transformed data in-memory.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleRunPreview} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1e293b' }}>
              <Play size={16} color="#10b981" />
              Run Data Preview
            </button>
            <button onClick={handleSavePipeline} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />
              Save Pipeline
            </button>
          </div>
        </div>

        {/* Pipeline Details Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>1. Target Dataset</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#0f172a', color: '#f8fafc', marginTop: '0.25rem' }}
            >
              <option value="">-- Select Uploaded Dataset --</option>
              {datasets.map((ds) => (
                <option key={ds._id} value={ds._id}>
                  {ds.originalName || ds.fileName} ({ds.totalRows.toLocaleString()} rows, {ds.columns?.length || ds.headers?.length} cols)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>2. Pipeline Name</label>
            <input
              type="text"
              placeholder="e.g. Financial Data Cleaning Workflow"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#0f172a', color: '#f8fafc', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>3. Description</label>
            <input
              type="text"
              placeholder="Filter amounts > 100 & rename ID column"
              value={pipelineDescription}
              onChange={(e) => setPipelineDescription(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#0f172a', color: '#f8fafc', marginTop: '0.25rem' }}
            />
          </div>
        </div>

        {/* Detected Columns & Data Types Badge Bar (Day 6 Feature) */}
        {currentDataset && currentDataset.columns && (
          <div style={{ backgroundColor: '#0f172a', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={14} /> Detected Dataset Columns & Schema (Day 6):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {currentDataset.columns.map((col, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                  }}
                >
                  <strong style={{ color: '#60a5fa' }}>{col.name}</strong>: <em style={{ color: '#a78bfa' }}>{col.dataType}</em>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas & Transformation Palette Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: '1rem', minHeight: '400px' }}>
        {/* Left Transformation Palette */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Transformation Palette
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Click to append transformation steps to visual pipeline:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {TRANSFORMATION_TYPES.map((trans) => {
              const IconComp = trans.icon;
              return (
                <button
                  key={trans.id}
                  onClick={() => handleAddTransformationNode(trans.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
                >
                  <IconComp size={18} color="#60a5fa" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{trans.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{trans.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Interactive Visual Canvas */}
        <div
          className="card"
          style={{
            position: 'relative',
            backgroundColor: '#090d16',
            backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            overflow: 'auto',
            minHeight: '380px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {nodes.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Layers size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Select a Dataset above to initialize Visual Canvas</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', minHeight: '350px', position: 'relative' }}>
              {/* Nodes Flow Container */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%', gap: '1rem', padding: '2rem' }}>
                {nodes.map((node, index) => {
                  const isSelected = selectedNodeId === node.id;
                  const isSource = node.type === 'source';
                  const isDest = node.type === 'destination';

                  return (
                    <React.Fragment key={node.id}>
                      {index > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
                          <ArrowRight size={24} />
                        </div>
                      )}

                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        style={{
                          minWidth: '180px',
                          padding: '1rem',
                          borderRadius: '10px',
                          backgroundColor: isSource ? '#064e3b' : isDest ? '#1e1b4b' : isSelected ? '#1e3a8a' : '#1e293b',
                          border: isSelected ? '2px solid #3b82f6' : isSource ? '1px solid #10b981' : isDest ? '1px solid #8b5cf6' : '1px solid #334155',
                          boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: isSource ? '#047857' : isDest ? '#4c1d95' : '#3b82f6',
                              color: '#fff',
                            }}
                          >
                            {node.type}
                          </span>

                          {!isSource && !isDest && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode(node.id);
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                              title="Remove Node"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc' }}>
                          {node.label || node.data?.transformationType?.toUpperCase()}
                        </div>

                        {/* Node details */}
                        {node.type === 'transformation' && node.data?.config && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                            {node.data.transformationType === 'filter' && `Col: ${node.data.config.column || '—'} ${node.data.config.operator || ''}`}
                            {node.data.transformationType === 'rename' && `${node.data.config.sourceColumn || '—'} ➔ ${node.data.config.targetColumn || '—'}`}
                            {node.data.transformationType === 'type_cast' && `${node.data.config.column || '—'} ➔ ${node.data.config.targetType || '—'}`}
                            {node.data.transformationType === 'deduplicate' && `Cols: ${(node.data.config.columns || []).join(', ')}`}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Properties & Configuration Inspector Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Node Inspector
          </h3>

          {!selectedNode ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click on any node on the canvas to configure properties.
            </p>
          ) : selectedNode.type === 'source' ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#10b981', marginBottom: '0.5rem' }}>CSV Source Node</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Dataset: {currentDataset?.originalName || currentDataset?.fileName || 'None'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Total Rows: {currentDataset?.totalRows?.toLocaleString() || 0}
              </p>
            </div>
          ) : selectedNode.type === 'destination' ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#a78bfa', marginBottom: '0.5rem' }}>Transformed Output Node</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Receives transformed stream output after pipeline execution.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#60a5fa' }}>
                Configure {selectedNode.data?.transformationType?.toUpperCase()} Rule
              </div>

              {/* FILTER CONFIGURATION */}
              {selectedNode.data?.transformationType === 'filter' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Column</label>
                    <select
                      value={selectedNode.data?.config?.column || ''}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { column: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="">-- Choose Column --</option>
                      {currentDataset?.headers?.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Operator</label>
                    <select
                      value={selectedNode.data?.config?.operator || 'equals'}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { operator: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than (&gt;)</option>
                      <option value="less_than">Less Than (&lt;)</option>
                      <option value="is_null">Is Null / Empty</option>
                      <option value="is_not_null">Is Not Null</option>
                    </select>
                  </div>

                  {!['is_null', 'is_not_null'].includes(selectedNode.data?.config?.operator) && (
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Value</label>
                      <input
                        type="text"
                        value={selectedNode.data?.config?.value ?? ''}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { value: e.target.value })}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* RENAME CONFIGURATION */}
              {selectedNode.data?.transformationType === 'rename' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Source Column</label>
                    <select
                      value={selectedNode.data?.config?.sourceColumn || ''}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { sourceColumn: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="">-- Choose Column --</option>
                      {currentDataset?.headers?.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>New Target Name</label>
                    <input
                      type="text"
                      placeholder="e.g. user_id"
                      value={selectedNode.data?.config?.targetColumn || ''}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { targetColumn: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                    />
                  </div>
                </>
              )}

              {/* TYPE CAST CONFIGURATION */}
              {selectedNode.data?.transformationType === 'type_cast' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Column</label>
                    <select
                      value={selectedNode.data?.config?.column || ''}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { column: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="">-- Choose Column --</option>
                      {currentDataset?.headers?.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Data Type</label>
                    <select
                      value={selectedNode.data?.config?.targetType || 'integer'}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { targetType: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="integer">Integer</option>
                      <option value="float">Float / Number</option>
                      <option value="string">String</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date (ISO)</option>
                    </select>
                  </div>
                </>
              )}

              {/* DEDUPLICATE CONFIGURATION */}
              {selectedNode.data?.transformationType === 'deduplicate' && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Unique Key Column</label>
                  <select
                    value={selectedNode.data?.config?.columns?.[0] || ''}
                    onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { columns: [e.target.value] })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
                  >
                    <option value="">-- Choose Column --</option>
                    {currentDataset?.headers?.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DATA PREVIEW MODAL / TABLE (Day 9 & Day 10 Feature) */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '90%',
              maxWidth: '1000px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0f172a',
              border: '1px solid #3b82f6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Play size={18} color="#10b981" />
                  In-Memory Data Preview (Day 9 Non-Persistent Verification)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <CheckCircle size={12} /> Data Preview executed in-memory. Database state remains 100% untouched.
                </span>
              </div>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
              {previewLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCcw size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '1rem' }}>Executing transformations in-memory on sample rows...</p>
                </div>
              ) : previewError ? (
                <div className="alert-error" style={{ margin: '1rem' }}>
                  <AlertCircle size={18} /> {previewError}
                </div>
              ) : previewResult ? (
                <div>
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#e2e8f0', backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                    <div>Dataset: <strong>{previewResult.datasetName}</strong></div>
                    <div>Original Sample Rows: <strong>{previewResult.originalRowCount}</strong></div>
                    <div>Preview Transformed Rows: <strong style={{ color: '#10b981' }}>{previewResult.previewRowCount}</strong></div>
                    <div>Rules Applied: <strong>{previewResult.appliedRulesCount}</strong></div>
                  </div>

                  <div className="table-container" style={{ maxHeight: '350px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          {previewResult.transformedHeaders?.map((header) => (
                            <th key={header} style={{ color: '#38bdf8' }}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewResult.previewData?.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{idx + 1}</td>
                            {previewResult.transformedHeaders?.map((header) => (
                              <td key={header}>{row[header] !== undefined && row[header] !== null ? String(row[header]) : '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineBuilder;
