'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RatingPriceScatterProps {
  data: Array<{
    rating: number;
    price: number;
    valueScore: number;
    horseName: string;
  }>;
}

export default function RatingPriceScatter({ data }: RatingPriceScatterProps) {
  // Function to get color based on value score
  const getColor = (valueScore: number) => {
    if (valueScore > 25) return '#10b981'; // green
    if (valueScore >= 15) return '#fbbf24'; // yellow
    return '#9ca3af'; // gray
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Rating vs Price Analysis</h3>
      <div className="mb-2 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Great Value (&gt;25)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Fair Value (15-25)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span>Avoid (&lt;15)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="rating" 
            name="Rating" 
            label={{ value: 'Rating', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number" 
            dataKey="price" 
            name="Price" 
            label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border border-gray-300 rounded shadow">
                    <p className="font-semibold">{data.horseName}</p>
                    <p className="text-xs">Rating: {data.rating}</p>
                    <p className="text-xs">Price: ${data.price.toFixed(2)}</p>
                    <p className="text-xs">Value Score: {data.valueScore.toFixed(1)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.valueScore)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
