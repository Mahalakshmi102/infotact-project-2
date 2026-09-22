import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { datasetService, systemService } from '../services/api';
import {
  UploadCloud,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Cpu,
  Layers,
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [dbHealth, setDbHealth] = useState({ isConnected: false, state: 'checking' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Poll datasets & DB connection
  const loadData = async () => {
    try {
      const [dsRes, healthRes] = await Promise.all([
        datasetService.getDatasets(),
        systemService.getHealth(),
      ]);
      setDatasets(dsRes.data || []);
      setDbHealth(healthRes.database || { isConnected: false, state: 'unknown' });
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // 3-second live refresh
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
        text: `Uploaded "${file.name}"! Node.js stream processor started.`,
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

  const handleDelete = async (id) => {
    try {
      await datasetService.deleteDataset(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete dataset:', err);
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
          <Activity size={24} />
          StreamWeaver
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
            Week 1 Demo
          </span>
        </div>

        <div className="nav-user">
          {/* MongoDB Connection Status Badge */}
          <div
            className={`badge ${
              dbHealth.isConnected ? 'badge-connected' : 'badge-disconnected'
            }`}
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

          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {user?.name} ({user?.email})
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

        {/* Top Info Grid */}
        <div className="grid-2">
          {/* File Upload Card */}
          <div className="card">
            <h2 className="card-title">
              <UploadCloud size={20} color="#3b82f6" />
              Upload & Stream CSV File
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Files are streamed chunk-by-chunk using native Node.js streams without buffering in RAM.
            </p>

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
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="upload-icon" />
              <p style={{ fontWeight: 600 }}>Drag & drop your CSV file here, or browse</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Supports small, medium, and large CSV files (up to 100MB)
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
                  <span>Uploading to server...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Architecture & Streaming Telemetry */}
          <div className="card">
            <h2 className="card-title">
              <Layers size={20} color="#3b82f6" />
              Week 1 Architecture Status
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>MongoDB Connection:</span>
                <span style={{ fontWeight: 600, color: dbHealth.isConnected ? '#10b981' : '#ef4444' }}>
                  {dbHealth.state?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Collections:</span>
                <span style={{ fontWeight: 600 }}>
                  users, datasets, pipelines, etl_jobs, transformations
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pipeline Mode:</span>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>Native Node.js Streams (Line-by-line)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Datasets Uploaded:</span>
                <span style={{ fontWeight: 600 }}>{datasets.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cumulative Rows Processed:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>
                  {datasets.reduce((acc, curr) => acc + (curr.totalRows || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              <FileText size={20} color="#3b82f6" />
              Uploaded Datasets & Streaming Metadata
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
                  <th>Processing Time</th>
                  <th>Detected Headers</th>
                  <th>Uploaded At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {datasets.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No datasets uploaded yet. Upload a CSV file above to test stream processing.
                    </td>
                  </tr>
                ) : (
                  datasets.map((ds) => (
                    <tr key={ds._id}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color="#60a5fa" />
                        {ds.originalName || ds.fileName}
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
                      <td>{ds.processingTimeMs ? `${ds.processingTimeMs} ms` : '—'}</td>
                      <td>
                        {ds.headers && ds.headers.length > 0 ? (
                          <span
                            title={ds.headers.join(', ')}
                            style={{
                              display: 'inline-block',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {ds.headers.slice(0, 4).join(', ')}
                            {ds.headers.length > 4 ? ` +${ds.headers.length - 4} more` : ''}
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
                          onClick={() => handleDelete(ds._id)}
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
      </main>
    </div>
  );
};

export default Dashboard;
