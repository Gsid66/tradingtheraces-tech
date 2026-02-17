'use client';

import { useState } from 'react';
import Link from 'next/link';
import { uploadConfigs } from '@/lib/config/upload-config';
import DataUploader from '@/components/admin/DataUploader';
import DataStats from '@/components/admin/DataStats';
import UploadHistory from '@/components/admin/UploadHistory';

export default function DataManagementPage() {
  // TODO: Add authentication check - ensure only admins can access this page
  // Example: const session = useSession(); if (!session?.user?.isAdmin) redirect('/');
  
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
              href="/"
              className="text-slate-300 hover:text-white transition-colors"
            >
              ← Back to Home
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
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-700 font-medium">Admin</span>
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
        {/* Security Notice */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>TODO:</strong> This page should be protected with authentication middleware.
                Only administrators should have access to upload data.
              </p>
            </div>
          </div>
        </div>

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
