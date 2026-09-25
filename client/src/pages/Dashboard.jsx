import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { datasetService, pipelineService, systemService } from '../services/api';
import PipelineBuilder from '../components/PipelineBuilder';
import {
  UploadCloud,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Layers,
  Grid,
  Play,
  Database,
  Sliders,
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'datasets' | 'pipelines_list'
  const [datasets, setDatasets] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [dbHealth, setDbHealth] = useState({ isConnected: false, state: 'checking' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Poll datasets, pipelines & DB connection health
  const loadData = async () => {
    try {
      const [dsRes, pipeRes, healthRes] = await Promise.all([
        datasetService.getDatasets(),
        pipelineService.getPipelines().catch(() => ({ data: [] })),
        systemService.getHealth().catch(() => ({ database: { isConnected: false, state: 'unknown' } })),
      ]);
      setDatasets(dsRes.data || []);
      setPipelines(pipeRes.data || []);
      setDbHealth(healthRes.database || { isConnected: false, state: 'unknown' });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please select a valid .csv file' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage(null);

    try {
      await datasetService.uploadDataset(file, (progress) => {
        setUploadProgress(progress);
      });
      setMessage({
        type: 'success',
        text: `Uploaded "${file.name}"! Stream processor started column detection & data type inference.`,
      });
      loadData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'File upload failed',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDataset = async (id) => {
    try {
      await datasetService.deleteDataset(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    }
  };

  const handleDeletePipeline = async (id) => {
    try {
      await pipelineService.deletePipeline(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete pipeline:', err);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          <Activity size={24} color="#3b82f6" />
          StreamWeaver
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', backgroundColor: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>
            Week 2 Final Workflow
          </span>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#0f172a', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`btn ${activeTab === 'pipeline' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Grid size={14} /> Visual Builder
          </button>

          <button
            onClick={() => setActiveTab('datasets')}
            className={`btn ${activeTab === 'datasets' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={14} /> Datasets & Types ({datasets.length})
          </button>

          <button
            onClick={() => setActiveTab('pipelines_list')}
            className={`btn ${activeTab === 'pipelines_list' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Layers size={14} /> Saved Pipelines ({pipelines.length})
          </button>
        </div>

        <div className="nav-user">
          {/* MongoDB Connection Status Badge */}
          <div
            className={`badge ${dbHealth.isConnected ? 'badge-connected' : 'badge-disconnected'}`}
            title={`Host: ${dbHealth.host || 'unknown'} | Database: ${dbHealth.database || 'unknown'}`}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: dbHealth.isConnected ? '#10b981' : '#ef4444',
                display: 'inline-block',
              }}
            />
            MongoDB: {dbHealth.isConnected ? 'Connected' : 'Disconnected'}
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {user?.name}
          </span>

          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Banner Alert */}
        {message && (
          <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
            {message.text}
          </div>
        )}

        {/* TAB 1: VISUAL PIPELINE BUILDER (Day 8, 9 & 10) */}
        {activeTab === 'pipeline' && (
          <PipelineBuilder
            datasets={datasets.filter((d) => d.status === 'completed')}
            onPipelineSaved={() => loadData()}
          />
        )}

        {/* TAB 2: DATASETS & DETECTED COLUMNS (Day 6 Task) */}
        {activeTab === 'datasets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Upload Card */}
            <div className="card">
              <h2 className="card-title">
                <UploadCloud size={20} color="#3b82f6" />
                Upload CSV Dataset & Automatic Column Detection (Day 6)
              </h2>

              <div
                className={`dropzone ${isDragOver ? 'active' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="upload-icon" />
                <p style={{ fontWeight: 600 }}>Drag & drop your CSV file here, or click to browse</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Supports CSV streaming & automatic column data type inference (integer, float, date, boolean, string)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
              </div>

              {uploading && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Datasets Table */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ margin: 0 }}>
                  <FileText size={20} color="#3b82f6" />
                  Uploaded Datasets, Columns & Data Types (Day 6)
                </h2>
                <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Total Rows</th>
                      <th>Detected Columns & Types (Day 6)</th>
                      <th>Uploaded At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No datasets uploaded yet. Upload a CSV file above to begin.
                        </td>
                      </tr>
                    ) : (
                      datasets.map((ds) => (
                        <tr key={ds._id}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={16} color="#60a5fa" />
                              {ds.originalName || ds.fileName}
                            </div>
                          </td>
                          <td>{formatBytes(ds.fileSize)}</td>
                          <td>
                            <span className={`badge badge-${ds.status}`}>
                              {ds.status === 'completed' && <CheckCircle2 size={12} />}
                              {ds.status === 'processing' && <Clock size={12} />}
                              {ds.status === 'failed' && <AlertTriangle size={12} />}
                              {ds.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#38bdf8' }}>
                            {ds.totalRows ? ds.totalRows.toLocaleString() : '—'}
                          </td>
                          <td>
                            {ds.columns && ds.columns.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '350px' }}>
                                {ds.columns.map((c, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '0.15rem 0.4rem',
                                      borderRadius: '4px',
                                      backgroundColor: '#1e293b',
                                      border: '1px solid #334155',
                                    }}
                                  >
                                    <strong style={{ color: '#60a5fa' }}>{c.name}</strong>: <span style={{ color: '#a78bfa' }}>{c.dataType}</span>
                                  </span>
                                ))}
                              </div>
                            ) : ds.headers ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {ds.headers.join(', ')}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(ds.createdAt).toLocaleTimeString()}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteDataset(ds._id)}
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.5rem' }}
                              title="Delete dataset"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SAVED PIPELINES LIST (Day 8 & Day 10 Task) */}
        {activeTab === 'pipelines_list' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>
                <Layers size={20} color="#3b82f6" />
                Saved Pipelines & Visual Workflows (Day 8 Storage)
              </h2>
              <button onClick={() => setActiveTab('pipeline')} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem' }}>
                <Grid size={14} /> Create New Pipeline
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Pipeline Name</th>
                    <th>Status</th>
                    <th>Target Dataset</th>
                    <th>Nodes Stored</th>
                    <th>Transformation Steps</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No saved pipelines yet. Use the Visual Builder tab to build and save a pipeline.
                      </td>
                    </tr>
                  ) : (
                    pipelines.map((pipe) => (
                      <tr key={pipe._id}>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                          <div>{pipe.name}</div>
                          {pipe.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pipe.description}</div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-completed">{pipe.status.toUpperCase()}</span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {pipe.datasetId?.originalName || pipe.datasetId?.fileName || '—'}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#60a5fa' }}>
                            {pipe.nodes?.length || 0} nodes
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {pipe.transformationSteps?.map((step, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px',
                                  backgroundColor: '#1e293b',
                                  color: '#38bdf8',
                                }}
                              >
                                Step {step.order}: {step.type || 'transform'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(pipe.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeletePipeline(pipe._id)}
                            className="btn btn-danger"
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="Delete pipeline"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
