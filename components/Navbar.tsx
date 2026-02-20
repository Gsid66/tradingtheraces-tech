'use client';
import NavigationLink from '@/components/NavigationLink';

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <NavigationLink href="/" className="text-white text-2xl font-bold hover:text-gray-200 transition">
          🏇 Trading the Races
        </NavigationLink>
        <div className="space-x-6">
          <NavigationLink href="/" className="text-white hover:text-gray-300 transition">Home</NavigationLink>
          <NavigationLink href="/form-guide" className="text-white hover:text-gray-300 transition">Live Ratings</NavigationLink>
          <NavigationLink href="/ratings-odds-comparison" className="text-white hover:text-gray-300 transition">Ratings vs Odds</NavigationLink>
          <NavigationLink href="/trading-desk" className="text-white hover:text-gray-300 transition">Trading Desk</NavigationLink>
          <NavigationLink href="/calculator" className="text-white hover:text-gray-300 transition">Calculator</NavigationLink>
          <a href="https://discord.gg/TawzRkQZgB" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 transition">Discord</a>
        </div>
      </div>
    </nav>
  );
}