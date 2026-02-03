'use client';

import { PLData } from '@/lib/trading-desk/plCalculator';

interface StatsCardProps {
  plData: PLData;
}

export default function StatsCard({ plData }: StatsCardProps) {
  const {
    totalValuePlays,
    winners,
    winRate,
    totalStaked,
    profitLoss,
    roi,
  } = plData;

  const isProfitable = profitLoss >= 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        💰 Profit/Loss Tracking
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Value Plays */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Total Value Plays</div>
          <div className="text-2xl font-bold text-purple-600">
            {totalValuePlays}
          </div>
        </div>

        {/* Winners */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Winners (1st only)</div>
          <div className="text-2xl font-bold text-green-600">
            {winners}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Win Rate (1st only)</div>
          <div className="text-2xl font-bold text-blue-600">
            {winRate.toFixed(1)}%
          </div>
        </div>

        {/* Total Staked */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Total Staked</div>
          <div className="text-2xl font-bold text-gray-600">
            ${totalStaked.toFixed(2)}
          </div>
        </div>

        {/* Profit/Loss */}
        <div className={`rounded-lg p-4 ${isProfitable ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-xs text-gray-600 mb-1">Profit/Loss</div>
          <div className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable ? '+' : ''}${profitLoss.toFixed(2)}
          </div>
        </div>

        {/* ROI */}
        <div className={`rounded-lg p-4 ${isProfitable ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-xs text-gray-600 mb-1">ROI</div>
          <div className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Based on $10 stakes on horses with value score &gt; 25
      </div>
    </div>
  );
}
