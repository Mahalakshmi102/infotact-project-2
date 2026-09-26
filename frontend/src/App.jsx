import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Datasets from './pages/Datasets';
import DatasetDetails from './pages/DatasetDetails'; // <-- Import theek kiya
import PipelineBuilder from './pages/PipelineBuilder';
import ETLJobs from './pages/ETLJobs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="datasets" element={<Datasets />} />
            
            {/* <-- Dataset Details Route yahan add kar diya hai --> */}
            <Route path="datasets/:id" element={<DatasetDetails />} />
            
            <Route path="pipeline-builder" element={<PipelineBuilder />} />
            <Route path="etl-jobs" element={<ETLJobs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}