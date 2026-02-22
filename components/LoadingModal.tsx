'use client';

import Image from 'next/image';
import { useLoading } from '@/app/providers/LoadingProvider';

export default function LoadingModal() {
  const { isLoading } = useLoading();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } bg-black/70 backdrop-blur-sm`}
    >
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 border border-purple-500 rounded-xl p-10 flex flex-col items-center gap-6 shadow-2xl">
        <h2 className="text-white text-2xl font-bold">Crunching the Data</h2>
        <Image
          src="/racestart.gif"
          alt="Loading horse animation"
          width={220}
          height={120}
          unoptimized
        />
        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-300 text-sm animate-pulse">Please wait...</p>
      </div>
    </div>
  );
}
