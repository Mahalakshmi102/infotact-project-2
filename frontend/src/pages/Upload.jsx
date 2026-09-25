import React, { useState } from 'react';
import api from '../services/api';

function Upload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/datasets/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('File uploaded and is processing!');
            setFile(null);
        } catch (err) {
            setMessage('Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Upload Dataset</h1>
            
            <div className="mt-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white">
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".csv,.json"
                    className="hidden" 
                    id="file-upload" 
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <span className="text-gray-500 mb-2">Drag & Drop CSV / JSON</span>
                    <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100">
                        Browse Files
                    </span>
                </label>
                
                {file && (
                    <div className="mt-6 text-left border-t pt-4">
                        <p className="text-sm text-gray-700"><strong>File Name:</strong> {file.name}</p>
                        <p className="text-sm text-gray-700"><strong>File Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                )}
            </div>

            <button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
                {uploading ? 'Uploading...' : 'Start Upload'}
            </button>

            {message && <p className="mt-4 text-center font-medium text-gray-700">{message}</p>}
        </div>
    );
}

export default Upload;