'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold hover:text-gray-200 transition">
          🏇 Trading the Races
        </Link>
        <div className="space-x-6">
          <Link href="/" className="text-white hover:text-gray-300 transition">Home</Link>
          <Link href="/form-guide" className="text-white hover:text-gray-300 transition">Live Ratings</Link>
          <Link href="/ratings-odds-comparison" className="text-white hover:text-gray-300 transition">Ratings vs Odds</Link>
          <Link href="/trading-desk" className="text-white hover:text-gray-300 transition">Trading Desk</Link>
          <Link href="/calculator" className="text-white hover:text-gray-300 transition">Calculator</Link>
          <a href="https://discord.gg/TawzRkQZgB" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 transition">Discord</a>
        </div>
      </div>
    </nav>
  );
}