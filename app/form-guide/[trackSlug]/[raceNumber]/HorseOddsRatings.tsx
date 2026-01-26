'use client';

interface Props {
  tabFixedWinPrice: number | null;
  tabFixedPlacePrice: number | null;
  tabFixedWinTimestamp: string | null;
  tabFixedPlaceTimestamp: string | null;
  ttrRating: number | null;
  ttrPrice: number | null;
}

export default function HorseOddsRatings({
  tabFixedWinPrice,
  tabFixedPlacePrice,
  tabFixedWinTimestamp,
  tabFixedPlaceTimestamp,
  ttrRating,
  ttrPrice,
}: Props) {
  // Helper function to format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '-';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '-' : `$${numPrice.toFixed(2)}`;
  };

  // Helper function to format rating
  const formatRating = (rating: number | string | null | undefined): string => {
    if (rating === null || rating === undefined) return '-';
    const numRating = typeof rating === 'string' ? parseInt(rating, 10) : rating;
    return isNaN(numRating) ? '-' : numRating.toString();
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
    });
  };

  // Determine if horse is value (TTR price < TAB price)
  const numTtrPrice = ttrPrice ? (typeof ttrPrice === 'string' ? parseFloat(ttrPrice) : ttrPrice) : null;
  const numTabFixedWinPrice = tabFixedWinPrice ? (typeof tabFixedWinPrice === 'string' ? parseFloat(tabFixedWinPrice) : tabFixedWinPrice) : null;
  
  const isValue = numTtrPrice && numTabFixedWinPrice && !isNaN(numTtrPrice) && !isNaN(numTabFixedWinPrice) && numTtrPrice < numTabFixedWinPrice;
  const isOvers = numTtrPrice && numTabFixedWinPrice && !isNaN(numTtrPrice) && !isNaN(numTabFixedWinPrice) && numTtrPrice > numTabFixedWinPrice;

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-green-50 rounded-lg border border-purple-200">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TAB Fixed Win */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            TAB Fixed Win
          </div>
          <div className="text-2xl font-bold text-purple-600">
            <span className={!tabFixedWinPrice ? 'text-gray-400' : ''}>{formatPrice(tabFixedWinPrice)}</span>
          </div>
          {tabFixedWinTimestamp && (
            <div className="text-xs text-gray-400 mt-1">
              {formatTime(tabFixedWinTimestamp)}
            </div>
          )}
        </div>

        {/* TAB Fixed Place */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            TAB Fixed Place
          </div>
          <div className="text-2xl font-bold text-purple-600">
            <span className={!tabFixedPlacePrice ? 'text-gray-400' : ''}>{formatPrice(tabFixedPlacePrice)}</span>
          </div>
          {tabFixedPlaceTimestamp && (
            <div className="text-xs text-gray-400 mt-1">
              {formatTime(tabFixedPlaceTimestamp)}
            </div>
          )}
        </div>

        {/* TTR Rating */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            TTR Rating
          </div>
          <div className="text-2xl font-bold text-green-600">
            <span className={!ttrRating ? 'text-gray-400' : ''}>{formatRating(ttrRating)}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Algorithm
          </div>
        </div>

        {/* TTR Price */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            TTR Price
          </div>
          <div className="text-2xl font-bold text-green-600">
            <span className={!ttrPrice ? 'text-gray-400' : ''}>{formatPrice(ttrPrice)}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Model Price
          </div>
        </div>
      </div>

      {/* Value Indicator */}
      {(isValue || isOvers) && (
        <div className="mt-3 text-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              isValue
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {isValue ? '✓ POTENTIAL VALUE' : '✗ POTENTIAL OVERS'}
          </span>
        </div>
      )}
    </div>
  );
}
