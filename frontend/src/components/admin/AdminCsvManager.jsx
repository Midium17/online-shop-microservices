import React, { useState } from 'react';

export default function AdminCsvManager({ token }) {
  const [file, setFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Export CSV
  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:8000/products/export-csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to export products');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage('Products exported successfully!');
    } catch (err) {
      setStatusMessage(`Export error: ${err.message}`);
    }
  };

  // Handle Import CSV Submission
  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatusMessage('Please select a CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setStatusMessage('');

    try {
      const response = await fetch('http://localhost:8000/products/import-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Import failed');

      setStatusMessage(`${data.message} (Errors: ${data.errors.length})`);
    } catch (err) {
      setStatusMessage(`Import error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto my-6">
      <h2 className="text-xl font-bold mb-4">Product Catalog CSV Management</h2>
      
      {/* Export Section */}
      <div className="mb-6 pb-6 border-b">
        <h3 className="font-semibold mb-2">Export Products</h3>
        <p className="text-sm text-gray-600 mb-3">Download all existing products as a spreadsheet CSV file.</p>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Download Products CSV
        </button>
      </div>

      {/* Import Section */}
      <div>
        <h3 className="font-semibold mb-2">Import Products</h3>
        <p className="text-sm text-gray-600 mb-3">Upload a CSV file containing new products to bulk-add them.</p>
        <form onSubmit={handleImport} className="space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload & Import CSV'}
          </button>
        </form>
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700 border">
          {statusMessage}
        </div>
      )}
    </div>
  );
}