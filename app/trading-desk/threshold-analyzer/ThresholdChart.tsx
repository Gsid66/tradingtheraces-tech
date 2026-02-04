'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

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

interface ThresholdChartProps {
  results: ThresholdResult[];
}

export default function ThresholdChart({ results }: ThresholdChartProps) {
  // Prepare data for the chart
  const chartData = results.map(r => ({
    threshold: r.threshold,
    roi: Number(r.roi.toFixed(2)),
    winRate: Number(r.winRate.toFixed(2)),
    totalBets: r.totalBets,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Performance by Threshold</h2>
      
      {/* ROI Chart */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-600 mb-3">ROI vs Threshold</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="threshold" 
              label={{ value: 'Threshold', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              labelFormatter={(label) => `Threshold: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="roi" 
              stroke="#10b981" 
              strokeWidth={2}
              name="ROI (%)"
              dot={{ fill: '#10b981', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Win Rate Chart */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Win Rate vs Threshold</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="threshold" 
              label={{ value: 'Threshold', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              labelFormatter={(label) => `Threshold: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="winRate" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Win Rate (%)"
              dot={{ fill: '#8b5cf6', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bet Volume Chart */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">Bet Volume vs Threshold</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="threshold" 
              label={{ value: 'Threshold', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Total Bets', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => value.toLocaleString()}
              labelFormatter={(label) => `Threshold: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalBets" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Total Bets"
              dot={{ fill: '#3b82f6', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Chart Insights</h3>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>The ROI chart shows profitability at each threshold level</li>
          <li>Win Rate indicates the percentage of bets that won</li>
          <li>Bet Volume shows the trade-off: higher thresholds = fewer opportunities</li>
        </ul>
      </div>
    </div>
  );
}
