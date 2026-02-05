'use client';

interface ThresholdResult {
  threshold: number;
  totalBets: number;
  winners: number;
  winRate: number;
  totalStaked: number;
  totalReturns: number;
  profitLoss: number;
  roi: number;
  avgValueScoreOfWinners: number;
  avgValueScoreAll: number;
  avgPrice: number;
}

interface ThresholdComparisonTableProps {
  results: ThresholdResult[];
  currentThreshold: number;
}

export default function ThresholdComparisonTable({ 
  results, 
  currentThreshold 
}: ThresholdComparisonTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Detailed Comparison</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Threshold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Bets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Winners
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P/L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Value Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => {
              const isCurrent = result.threshold === currentThreshold;
              const isPositiveROI = result.roi > 0;
              
              return (
                <tr 
                  key={result.threshold}
                  className={isCurrent ? 'bg-blue-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {result.threshold}
                      </span>
                      {isCurrent && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.totalBets.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.winners}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.winRate.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      isPositiveROI ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositiveROI ? '+' : ''}{result.roi.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      result.profitLoss > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${result.profitLoss > 0 ? '+' : ''}{result.profitLoss.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${result.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.avgValueScoreAll.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Higher thresholds result in fewer bets but may improve quality. 
          Consider your risk tolerance and betting volume preferences when choosing a threshold.
        </p>
      </div>
    </div>
  );
}
