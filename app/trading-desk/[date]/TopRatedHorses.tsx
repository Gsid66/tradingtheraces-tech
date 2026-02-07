'use client';

interface RatedHorse {
  horse_name: string;
  rating: number;
  price: number;
  track_name: string;
  race_number: number;
  valueScore: number;
}

interface TopRatedHorsesProps {
  horses: RatedHorse[];
}

export default function TopRatedHorses({ horses }: TopRatedHorsesProps) {
  if (horses.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Top 4 Rated Horses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {horses.map((horse, index) => (
          <div 
            key={`${horse.track_name}-${horse.race_number}-${horse.horse_name}`} 
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{horse.horse_name}</h3>
                <p className="text-sm text-gray-600">{horse.track_name} - R{horse.race_number}</p>
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full ml-2">
                #{index + 1}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rating:</span>
                <span className="text-lg font-bold text-blue-600">{Number(horse.rating).toFixed(1)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="text-base font-semibold text-gray-900">${Number(horse.price).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Value Score:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  horse.valueScore > 25 ? 'bg-green-100 text-green-800' :
                  horse.valueScore >= 15 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {horse.valueScore.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
