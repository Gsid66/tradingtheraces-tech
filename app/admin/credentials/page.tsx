'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminCredentialsPage() {
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculator
  const calculatePasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 12.5;
    if (/[A-Z]/.test(password)) strength += 12.5;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    
    let text = '';
    let color = '';
    
    if (strength < 25) {
      text = 'Very Weak';
      color = 'text-red-600';
    } else if (strength < 50) {
      text = 'Weak';
      color = 'text-orange-600';
    } else if (strength < 75) {
      text = 'Good';
      color = 'text-yellow-600';
    } else {
      text = 'Strong';
      color = 'text-green-600';
    }
    
    return { strength, text, color };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const verifyCurrentPassword = async () => {
    if (!currentUsername || !currentPassword) {
      setError('Please enter your current username and password');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUsername, 
          password: currentPassword 
        })
      });

      const data = await response.json();

      if (data.success) {
        setVerified(true);
        setMessage('✅ Current credentials verified. You can now update your credentials.');
      } else {
        setError(data.message || 'Invalid current credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateCredentials = async () => {
    // Validation
    if (!newUsername && !newPassword) {
      setError('Please provide at least a new username or password');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Credentials updated successfully! ${newUsername ? 'New username: ' + newUsername : ''}`);
        // Reset form
        setNewUsername('');
        setNewPassword('');
        setConfirmPassword('');
        setVerified(false);
        setCurrentUsername(data.username || currentUsername);
        setCurrentPassword('');
      } else {
        setError(data.message || 'Failed to update credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Credentials Management</h1>
              <p className="text-slate-300 mt-2">
                Manage admin username and password
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
                <span className="text-gray-700 font-medium">Credentials Management</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Credentials Verification */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 1: Verify Current Credentials</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Username
              </label>
              <input
                type="text"
                value={currentUsername}
                onChange={(e) => setCurrentUsername(e.target.value)}
                disabled={verified}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900 disabled:bg-gray-100"
                placeholder="Enter current username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={verified}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900 disabled:bg-gray-100"
                placeholder="Enter current password"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showPassword" className="text-sm text-gray-700">
                Show passwords
              </label>
            </div>

            {!verified && (
              <button
                onClick={verifyCurrentPassword}
                disabled={loading || !currentUsername || !currentPassword}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : '✓ Verify Credentials'}
              </button>
            )}

            {verified && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                ✅ Credentials verified! You can now update your admin credentials below.
              </div>
            )}
          </div>
        </div>

        {/* New Credentials Form */}
        {verified && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 2: Update Credentials</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Username (Optional)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900"
                  placeholder="Leave empty to keep current username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    onClick={generatePassword}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    🎲 Generate
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Password Strength:</span>
                      <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordStrength.strength < 25 ? 'bg-red-500' :
                          passwordStrength.strength < 50 ? 'bg-orange-500' :
                          passwordStrength.strength < 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                onClick={updateCredentials}
                disabled={loading || (!newUsername && !newPassword)}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : '🔄 Update Credentials'}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🔒 Security Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>First, verify your current credentials in Step 1</li>
            <li>You can update username, password, or both in Step 2</li>
            <li>Use the &quot;Generate&quot; button to create a strong password</li>
            <li>Password must be at least 6 characters long</li>
            <li>Make sure to save your new credentials securely</li>
            <li>You will need to log in again with new credentials if changed</li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="space-y-2">
            <Link
              href="/admin"
              className="block px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
            >
              → Back to Admin Dashboard
            </Link>
            <Link
              href="/admin/login"
              className="block px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              → Login Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
