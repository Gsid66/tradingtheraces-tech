import React from 'react';

interface StatisticsCardsProps {
  totalRecords: number;
}

export default function StatisticsCards({
  totalRecords
}: StatisticsCardsProps) {
  return (
    <div className="mb-6">
      <div 
        className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-100 hover:border-purple-300 transition-colors"
      >
        <h3 className="text-gray-600 text-sm font-medium mb-2">Total Records</h3>
        <p className="text-3xl font-bold text-purple-600">{totalRecords.toLocaleString()}</p>
      </div>
    </div>
  );
}
