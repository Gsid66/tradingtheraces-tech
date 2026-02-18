import Link from 'next/link';
import { FaDiscord, FaGlobeAsia, FaGlobeEurope, FaCodeBranch, FaChartBar, FaMagic } from 'react-icons/fa';
import { GiHorseHead } from 'react-icons/gi';

export default function NavigationCards() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Live TTR Ratings Card - ACTIVE */}
        <Link href="/form-guide">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 transition-all cursor-pointer border-2 border-purple-500 shadow-lg shadow-purple-500/30">
            <div className="text-white text-5xl mb-4" role="img" aria-label="Chart trending upward icon">📈</div>
            <h2 className="text-white text-xl font-semibold mb-2">Live TTR Ratings</h2>
            <p className="text-gray-300 text-sm">Real-time race ratings</p>
          </div>
        </Link>

        {/* UK Ratings Card - ACTIVE */}
        <Link href="/ttr-uk-ire-ratings">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/50 transition-all cursor-pointer border-2 border-red-600 shadow-lg shadow-red-500/30">
            <FaGlobeEurope className="text-white text-5xl mb-4 mx-auto" />
            <h2 className="text-white text-xl font-semibold mb-2">UK Ratings</h2>
            <p className="text-gray-300 text-sm">United Kingdom ratings</p>
          </div>
        </Link>

        {/* Ireland Ratings Card - ACTIVE */}
        <Link href="/ttr-uk-ire-ratings">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/50 transition-all cursor-pointer border-2 border-green-500 shadow-lg shadow-green-500/30">
            <GiHorseHead className="text-white text-5xl mb-4 mx-auto" />
            <h2 className="text-white text-xl font-semibold mb-2">Ireland Ratings</h2>
            <p className="text-gray-300 text-sm">Irish racing ratings</p>
          </div>
        </Link>

        {/* AU/NZ Ratings Card - ACTIVE */}
        <Link href="/ttr-au-nz-ratings">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50 transition-all cursor-pointer border-2 border-amber-500 shadow-lg shadow-amber-500/30">
            <FaGlobeAsia className="text-white text-5xl mb-4 mx-auto" />
            <h2 className="text-white text-xl font-semibold mb-2">AU/NZ Ratings</h2>
            <p className="text-gray-300 text-sm">Australia & New Zealand</p>
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

        {/* NEW CARD 1 - Merged Ratings */}
        <Link href="/merged-ratings">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all cursor-pointer border-2 border-cyan-500 shadow-lg shadow-cyan-500/30">
            <FaCodeBranch className="text-white text-5xl mb-4 mx-auto" />
            <h2 className="text-white text-xl font-semibold mb-2">Merged Ratings</h2>
            <p className="text-gray-300 text-sm">RVO + TTR Analysis</p>
          </div>
        </Link>

        {/* NEW CARD 2 - Advanced Analysis */}
        <div className="bg-black/60 rounded-lg p-8 text-center border-2 border-pink-500 shadow-lg shadow-pink-500/30 opacity-60 cursor-not-allowed">
          <FaChartBar className="text-white text-5xl mb-4 mx-auto" />
          <h2 className="text-white text-xl font-semibold mb-2">Advanced Analysis</h2>
          <p className="text-gray-300 text-sm">Decoding The Data (Coming Soon)</p>
        </div>

        {/* NEW CARD 3 - Sherlock Hooves AI */}
        <div className="bg-black/60 rounded-lg p-8 text-center border-2 border-indigo-500 shadow-lg shadow-indigo-500/30 opacity-60 cursor-not-allowed">
          <FaMagic className="text-white text-5xl mb-4 mx-auto" />
          <h2 className="text-white text-xl font-semibold mb-2">Sherlock Hooves</h2>
          <p className="text-gray-300 text-sm">AI Agent (Coming Soon)</p>
        </div>

      </div>
    </div>
  );
}
