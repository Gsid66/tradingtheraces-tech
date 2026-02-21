'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// LoginForm component that uses useSearchParams
function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the original destination or admin dashboard
        const from = searchParams.get('from') || '/admin';
        router.push(from);
        router.refresh();
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Failed to connect to authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md mx-4 sm:mx-0">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Admin Portal</h1>
        <p className="text-gray-600">Trading the Races</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 min-h-[44px]"
            placeholder="Enter username"
            required
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 min-h-[44px]"
            placeholder="Enter password"
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 min-h-[44px]"
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-purple-600 hover:text-purple-700 min-h-[44px] inline-flex items-center">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

// Loading fallback component
function LoginFormFallback() {
  return (
    <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Portal</h1>
        <p className="text-gray-600">Trading the Races</p>
      </div>
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    </div>
  );
}

// Main page component
export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
