'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-300 mt-2">
                Administrator
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome to the Admin Portal
          </h2>
          <p className="text-gray-600">
            Manage all administrative functions from this central dashboard.
          </p>
        </div>

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Data Management Card */}
          <Link
            href="/admin/data-management"
            className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-600"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Data Management</h3>
            <p className="text-gray-600 mb-4">
              Upload CSV files for ratings and race data
            </p>
            <div className="text-blue-600 font-medium text-sm">
              View & Upload Data →
            </div>
          </Link>

          {/* Trading Desk Password Manager Card */}
          <Link
            href="/admin/trading-desk-password"
            className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-purple-600"
          >
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Trading Desk Password</h3>
            <p className="text-gray-600 mb-4">
              Manage user access password for Trading Desk
            </p>
            <div className="text-purple-600 font-medium text-sm">
              Manage Password →
            </div>
          </Link>

          {/* UK Project Card (Placeholder) */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-300 opacity-60">
            <div className="text-4xl mb-4">🇬🇧</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">UK Project Admin</h3>
            <p className="text-gray-600 mb-4">
              UK racing project administration
            </p>
            <div className="text-gray-500 font-medium text-sm">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="space-y-2">
            <Link
              href="/trading-desk"
              className="block px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              → View Trading Desk
            </Link>
            <Link
              href="/form-guide"
              className="block px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              → View Form Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
