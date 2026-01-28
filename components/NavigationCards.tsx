import Link from 'next/link'

export default function NavigationCards() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        
        {/* Live TTR Ratings Card - ACTIVE */}
        <Link href="/form-guide">
          <div className="bg-black/60 rounded-lg p-8 text-center hover:bg-black/80 hover:border-2 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 transition-all cursor-pointer border-2 border-purple-500 shadow-lg shadow-purple-500/30">
            <div className="text-white text-5xl mb-4" role="img" aria-label="Chart trending upward icon">📈</div>
            <h2 className="text-white text-xl font-semibold mb-2">Live TTR Ratings</h2>
            <p className="text-gray-300 text-sm">Real-time race ratings</p>
          </div>
        </Link>

        {/* Race Fields Hub Card - Coming Soon */}
        <div className="bg-black/40 rounded-lg p-8 text-center opacity-60 cursor-not-allowed border-2 border-transparent" role="button" aria-disabled="true">
          <div className="text-white text-5xl mb-4" role="img" aria-label="Clipboard icon">📋</div>
          <h2 className="text-white text-xl font-semibold mb-2">Race Fields Hub</h2>
          <p className="text-gray-300 text-sm">Official fields &amp; guides</p>
          <p className="text-purple-300 text-xs mt-2 font-semibold">Coming Soon</p>
        </div>

        {/* Betting Calculator Card - Coming Soon */}
        <div className="bg-black/40 rounded-lg p-8 text-center opacity-60 cursor-not-allowed border-2 border-transparent" role="button" aria-disabled="true">
          <div className="text-white text-5xl mb-4" role="img" aria-label="Calculator icon">🧮</div>
          <h2 className="text-white text-xl font-semibold mb-2">Betting Calculator</h2>
          <p className="text-gray-300 text-sm">Calculate returns</p>
          <p className="text-purple-300 text-xs mt-2 font-semibold">Coming Soon</p>
        </div>

      </div>
    </div>
  )
}
