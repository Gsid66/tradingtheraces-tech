'use client';

export default function UploadHistory() {
  // TODO: Implement upload history tracking
  // This could use the existing scraper_logs table or a new admin_logs table
  // For now, display a placeholder message

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Upload History</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          <strong>Coming Soon:</strong> Upload history tracking will be implemented in a future update.
          This will display recent uploads, timestamps, and status information.
        </p>
      </div>
    </div>
  );
}
