import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Guards
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Datasets from './pages/Datasets';
import DatasetDetails from './pages/DatasetDetails';
import PipelineBuilder from './pages/PipelineBuilder';
import DataPreview from './pages/DataPreview';
import CustomTransform from './pages/CustomTransform'; // <-- Day 11 Import
import ETLJobs from './pages/ETLJobs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="datasets/:id" element={<DatasetDetails />} />
          <Route path="pipeline-builder" element={<PipelineBuilder />} />
          <Route path="preview" element={<DataPreview />} />
          <Route path="custom-transform" element={<CustomTransform />} /> {/* <-- Day 11 Route */}
          <Route path="etl-jobs" element={<ETLJobs />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}