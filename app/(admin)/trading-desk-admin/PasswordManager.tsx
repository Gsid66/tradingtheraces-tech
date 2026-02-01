'use client';

import { useState } from 'react';

export default function PasswordManager() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(array[i] % chars.length);
    }
    setNewPassword(password);
    setMessage('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setMessage('Password copied to clipboard!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to copy to clipboard');
      setMessageType('error');
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/trading-desk/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Password updated successfully! Users can now log in with the new password.');
        setMessageType('success');
        setNewPassword('');
      } else {
        setMessage(data.message || 'Failed to update password');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Password Manager</h1>
          <p className="text-gray-400">Manage Trading Desk user access</p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Instructions</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• Generate a random password or enter your own custom password</li>
            <li>• Click "Copy to Clipboard" to easily share with users</li>
            <li>• Click "Update Password" to save the new password</li>
            <li>• Users will immediately be able to log in with the new password</li>
            <li>• Old passwords will no longer work after updating</li>
          </ul>
        </div>

        {/* Password Manager Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-white"
              />
              <button
                onClick={generatePassword}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                Generate Random
              </button>
            </div>
          </div>

          {newPassword && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Current Password:</div>
              <div className="text-2xl font-mono font-bold text-purple-400">{newPassword}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              disabled={!newPassword}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:text-gray-500"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={updatePassword}
              disabled={!newPassword || loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-800 disabled:text-gray-500"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-900 border border-green-700 text-green-200' 
                : 'bg-red-900 border border-red-700 text-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-900 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Security Note</h3>
          <p className="text-sm text-blue-200">
            Passwords are hashed using bcrypt before storage. Only share passwords through secure channels.
          </p>
        </div>
      </div>
    </div>
  );
}
