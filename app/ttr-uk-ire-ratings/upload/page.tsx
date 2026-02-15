'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UploadResult {
  success: boolean;
  message: string;
  recordsImported?: number;
  recordsProcessed?: number;
  recordsSkipped?: number;
  executionTime?: number;
  raceDates?: string[];
  errors?: string[];
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Clear previous result
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ttr-uk-ire-ratings/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResult = await response.json();
      setResult(data);

      if (data.success && data.raceDates && data.raceDates.length > 0) {
        // Optionally redirect to the first date's display page after a delay
        // setTimeout(() => {
        //   router.push(`/ttr-uk-ire-ratings/${data.raceDates[0]}`);
        // }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        message: 'Failed to upload file. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Upload TTR UK/Ireland Ratings
          </h1>
          <p className="text-gray-600">
            Upload a CSV file containing TTR racing ratings data
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">CSV Format Requirements</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Required columns (tab-separated):</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Date:</strong> Format: &quot;Sunday, 15th February 2026&quot;</li>
              <li><strong>Track:</strong> Track name (e.g., &quot;Musselburgh&quot;)</li>
              <li><strong>Race:</strong> Format: &quot;Race 1 - Full Race Name&quot;</li>
              <li><strong>SaddleCloth:</strong> Saddle cloth number (optional)</li>
              <li><strong>Horse:</strong> Horse name</li>
              <li><strong>Jockey:</strong> Jockey name (optional)</li>
              <li><strong>Trainer:</strong> Trainer name (optional)</li>
              <li><strong>Rating:</strong> Rating value (optional)</li>
              <li><strong>Price:</strong> Format: &quot;$2.15&quot; (optional)</li>
            </ul>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-50 file:text-purple-700
                    hover:file:bg-purple-100
                    cursor-pointer"
                />
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full py-3 px-6 rounded-md font-semibold text-white transition-colors ${
                  !file || uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload Ratings'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Upload Result */}
        {result && (
          <div className={`rounded-lg shadow p-6 mb-8 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Upload Successful!' : 'Upload Failed'}
                </h3>
                <p className={`text-sm mb-4 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>

                {/* Statistics */}
                {result.recordsImported !== undefined && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-600">Processed</div>
                      <div className="text-2xl font-bold text-gray-800">{result.recordsProcessed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Imported</div>
                      <div className="text-2xl font-bold text-green-600">{result.recordsImported}</div>
                    </div>
                    {result.recordsSkipped !== undefined && result.recordsSkipped > 0 && (
                      <div>
                        <div className="text-xs text-gray-600">Skipped</div>
                        <div className="text-2xl font-bold text-yellow-600">{result.recordsSkipped}</div>
                      </div>
                    )}
                    {result.executionTime !== undefined && (
                      <div>
                        <div className="text-xs text-gray-600">Time</div>
                        <div className="text-2xl font-bold text-gray-800">{(result.executionTime / 1000).toFixed(2)}s</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-red-900 mb-2">Errors:</h4>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* View Links */}
                {result.success && result.raceDates && result.raceDates.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-semibold text-green-900">View Uploaded Data:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.raceDates.map((date) => (
                        <Link
                          key={date}
                          href={`/ttr-uk-ire-ratings/${date}`}
                          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          View {date}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
