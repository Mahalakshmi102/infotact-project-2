import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Settings, LogOut } from 'lucide-react';

function DashboardLayout() {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r shadow-sm">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">NexusFlow</h1>
                </div>
                <nav className="p-4 space-y-2">
                    <Link to="/dashboard" className="flex items-center space-x-3 text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/dashboard/datasets" className="flex items-center space-x-3 text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                        <Database size={20} />
                        <span>Datasets</span>
                    </Link>
                    <Link to="/dashboard/upload" className="flex items-center space-x-3 text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                        <Database size={20} />
                        <span>Upload Data</span>
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-4 border-t">
                    <button onClick={handleLogout} className="flex items-center space-x-3 text-gray-700 p-2 w-full rounded-lg hover:bg-gray-100">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800">Welcome</h2>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;