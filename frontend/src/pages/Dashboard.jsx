import React, { useEffect, useState } from 'react';
import api from '../services/api';

function Dashboard() {
    const [datasets, setDatasets] = useState([]);

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                const res = await api.get('/datasets');
                setDatasets(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDatasets();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Your Datasets</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (KB)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {datasets.map(dataset => (
                            <tr key={dataset._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{dataset.fileName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{(dataset.fileSize / 1024).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{dataset.totalRows}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dataset.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {dataset.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {datasets.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No datasets found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;