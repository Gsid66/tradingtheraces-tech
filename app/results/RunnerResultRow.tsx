'use client';

interface Props {
  runner: any;
  position: number;
}

// Format margin display
function formatMargin(margin: string | number): string {
  if (!margin) return '-';
  
  const marginStr = String(margin).toUpperCase();
  
  // Handle special text margins
  if (['NECK', 'HEAD', 'NOSE', 'SHORT HEAD', 'LONG HEAD', 'SHORT NECK'].includes(marginStr)) {
    return marginStr;
  }
  
  // Handle numeric margins
  const num = parseFloat(String(margin));
  if (!isNaN(num)) {
    return `${num.toFixed(2)}L`;
  }
  
  return marginStr;
}

// Format price
function formatPrice(price: number): string {
  if (!price || price === 0) return '-';
  return `$${price.toFixed(2)}`;
}

// Format prize money
function formatPrizeMoney(amount: number): string {
  if (!amount || amount === 0) return '-';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

// Get position badge colors
function getPositionBadgeStyle(position: number): string {
  switch (position) {
    case 1:
      return 'bg-yellow-400 text-yellow-900 border-yellow-500';
    case 2:
      return 'bg-gray-300 text-gray-900 border-gray-400';
    case 3:
      return 'bg-orange-400 text-orange-900 border-orange-500';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

// Get position emoji
function getPositionEmoji(position: number): string {
  switch (position) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

export default function RunnerResultRow({ runner, position }: Props) {
  const horseName = runner.horseName || runner.name || 'Unknown Horse';
  const jockeyName = runner.jockeyName || runner.jockey?.fullName || 'Unknown Jockey';
  const trainerName = runner.trainerName || runner.trainer?.fullName || 'Unknown Trainer';
  const margin = formatMargin(runner.margin || runner.marginToWinner || 0);
  const startingPrice = formatPrice(runner.startingPrice || runner.priceSP || 0);
  const prizeMoney = formatPrizeMoney(runner.prizeMoneyWon || runner.prizeMoney || 0);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      {/* Position Badge */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${getPositionBadgeStyle(position)}`}>
        {position <= 3 ? getPositionEmoji(position) : position}
      </div>

      {/* Runner Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{horseName}</h4>
            <div className="text-sm text-gray-600 space-y-0.5">
              <div>Jockey: {jockeyName}</div>
              <div>Trainer: {trainerName}</div>
            </div>
          </div>
          
          <div className="flex flex-col items-end text-right text-sm space-y-0.5">
            {position > 1 && (
              <div className="text-gray-600">
                <span className="font-medium">Margin:</span> {margin}
              </div>
            )}
            <div className="text-gray-600">
              <span className="font-medium">SP:</span> {startingPrice}
            </div>
            {runner.prizeMoneyWon > 0 && (
              <div className="text-green-600 font-medium">
                {prizeMoney}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
