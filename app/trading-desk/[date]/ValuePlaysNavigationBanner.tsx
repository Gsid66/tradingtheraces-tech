'use client';

interface ValuePlaysNavigationBannerProps {
  count: number;
}

export default function ValuePlaysNavigationBanner({ count }: ValuePlaysNavigationBannerProps) {
  const handleScrollToValuePlays = () => {
    const element = document.getElementById('top-value-plays');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mb-6 sm:mb-8">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left section with icon, title, and description */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl" role="img" aria-label="target">🎯</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Top 10 Value Plays</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                      {count} play{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-purple-50 text-sm sm:text-base leading-relaxed">
                Jump to the horses with the best value scores - where our ratings suggest better odds than the market
              </p>
            </div>
            
            {/* Right section with button */}
            <div className="w-full sm:w-auto">
              <button
                onClick={handleScrollToValuePlays}
                className="w-full sm:w-auto bg-white text-purple-600 hover:bg-purple-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <span>View Top 10</span>
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
