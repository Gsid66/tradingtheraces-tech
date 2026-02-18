'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MergedRatingsPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    setMessage('Password copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/merged-ratings/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Password updated successfully!');
        setNewPassword('');
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Merged Ratings Password Manager</h1>
              <p className="text-slate-300 mt-2">
                Manage user access password for Merged Ratings
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
                <span className="text-gray-700 font-medium">Merged Ratings Password</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Password Manager */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">User Password Manager</h2>

          <div className="space-y-6">
            {/* Generate Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                  placeholder="Enter or generate a password"
                />
                <button
                  onClick={generatePassword}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  🎲 Generate
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={copyToClipboard}
                disabled={!newPassword}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={updatePassword}
                disabled={!newPassword || loading}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : '🔄 Update Password'}
              </button>
            </div>

            {/* Messages */}
            {message && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📝 Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Click &quot;Generate&quot; to create a secure random password</li>
                <li>Or type your own password (minimum 6 characters)</li>
                <li>Click &quot;Copy to Clipboard&quot; to copy the password</li>
                <li>Click &quot;Update Password&quot; to save the new user password</li>
                <li>Share the password securely with authorized users</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="space-y-2">
            <Link
              href="/merged-ratings"
              className="block px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              → View Merged Ratings
            </Link>
            <Link
              href="/admin"
              className="block px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
            >
              → Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
