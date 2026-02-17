'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new admin location
    router.replace('/admin/trading-desk-password');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the new admin location</p>
      </div>
    </div>
  );
}
