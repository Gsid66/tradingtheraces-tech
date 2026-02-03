'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ROIChartProps {
  data: Array<{
    date: string;
    roi: number;
  }>;
}

export default function ROIChart({ data }: ROIChartProps) {
  // Determine if overall ROI is positive
  const isPositive = data.length > 0 && data[data.length - 1].roi >= 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Cumulative ROI Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `${value}%`} />
          <Area 
            type="monotone" 
            dataKey="roi" 
            stroke={isPositive ? '#10b981' : '#ef4444'}
            fill={isPositive ? '#10b981' : '#ef4444'}
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
