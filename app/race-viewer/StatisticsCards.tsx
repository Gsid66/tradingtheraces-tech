import React from 'react';

interface StatisticsCardsProps {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  recordsPerPage: number;
}

export default function StatisticsCards({
  totalRecords,
  currentPage,
  totalPages,
  recordsPerPage
}: StatisticsCardsProps) {
  const stats = [
    { title: 'Total Records', value: totalRecords.toLocaleString() },
    { title: 'Current Page', value: currentPage.toString() },
    { title: 'Total Pages', value: totalPages.toString() },
    { title: 'Records Per Page', value: recordsPerPage.toString() }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div 
          key={stat.title}
          className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-100 hover:border-purple-300 transition-colors"
        >
          <h3 className="text-gray-600 text-sm font-medium mb-2">{stat.title}</h3>
          <p className="text-3xl font-bold text-purple-600">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
