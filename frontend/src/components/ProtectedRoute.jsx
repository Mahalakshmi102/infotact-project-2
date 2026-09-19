import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Check karte hain token localStorage me maujood hai ya nahi
  const token = localStorage.getItem('token');

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}