import Link from 'next/link';
import { FaDiscord } from 'react-icons/fa';  // ⬅️ ADD THIS

export default function NavigationCards() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Live TTR Ratings Card - ACTIVE */}
        <Link href="/form-guide">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 transition-all cursor-pointer border-2 border-purple-500 shadow-lg shadow-purple-500/30">
            <div className="text-white text-5xl mb-4" role="img" aria-label="Chart trending upward icon">📈</div>
            <h2 className="text-white text-xl font-semibold mb-2">Live TTR Ratings</h2>
            <p className="text-gray-300 text-sm">Real-time race ratings</p>
          </div>
        </Link>

        {/* Discord Card - ACTIVE */}
        <a 
          href="https://discord.gg/TawzRkQZgB" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 transition-all cursor-pointer border-2 border-purple-500 shadow-lg shadow-purple-500/30">
            <FaDiscord className="text-white text-5xl mb-4 mx-auto" />
            <h2 className="text-white text-xl font-semibold mb-2">Join Our Discord</h2>
            <p className="text-gray-300 text-sm">Community chat & support</p>
          </div>
        </a>

        {/* Betting Calculator Card - ACTIVE */}
        <Link href="/calculator">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 transition-all cursor-pointer border-2 border-purple-500 shadow-lg shadow-purple-500/30">
            <div className="text-white text-5xl mb-4" role="img" aria-label="Calculator icon">🧮</div>
            <h2 className="text-white text-xl font-semibold mb-2">Betting Calculator</h2>
            <p className="text-gray-300 text-sm">Calculate returns</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
