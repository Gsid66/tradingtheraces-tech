'use client';

import { useState } from 'react';
import Link from 'next/link';
import { uploadConfigs } from '@/lib/config/upload-config';
import DataUploader from '@/components/admin/DataUploader';
import DataStats from '@/components/admin/DataStats';
import UploadHistory from '@/components/admin/UploadHistory';

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState(uploadConfigs[0].id);

  const activeConfig = uploadConfigs.find(config => config.id === activeTab) || uploadConfigs[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Data Management</h1>
              <p className="text-slate-300 mt-2">
                Upload and manage racing ratings data
              </p>
            </div>
            <Link
              href="/admin"
              className="text-slate-300 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                  Admin
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-700 font-medium">Data Management</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="mb-8">
          <DataStats />
        </div>

        {/* Upload History */}
        <div className="mb-8">
          <UploadHistory />
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">Data Upload</h2>
              <p className="text-gray-600 mt-1">Select a data type to upload CSV files</p>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 px-6 overflow-x-auto">
              {uploadConfigs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => setActiveTab(config.id)}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === config.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <DataUploader config={activeConfig} />
          </div>
        </div>

        {/* Links to Legacy Upload Pages */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Legacy Upload Pages</h3>
          <p className="text-sm text-blue-800 mb-4">
            The original upload pages are still available for backward compatibility:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/ttr-au-nz-ratings/upload"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              TTR AU/NZ Upload Page
            </Link>
            <Link
              href="/ttr-uk-ire-ratings/upload"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              TTR UK/Ireland Upload Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
