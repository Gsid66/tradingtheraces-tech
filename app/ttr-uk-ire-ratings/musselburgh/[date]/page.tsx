import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

interface PageProps {
  params: Promise<{ date: string }>;
}

interface RaceData {
  number: number;
  name: string;
  distance: string;
  favorite: {
    name: string;
    rating: number;
    price: string;
  };
  contenders: Array<{
    name: string;
    rating: number;
    price: string;
    label: string;
  }>;
}

export default async function MusselburghPage({ params }: PageProps) {
  const { date } = await params;

  const races: RaceData[] = [
    {
      number: 1,
      name: 'Sunshine On Leith Maiden Hurdle',
      distance: '3130m',
      favorite: { name: 'Fantasy World', rating: 218, price: '$2.15' },
      contenders: [
        { name: 'Desert Dreamer', rating: 205, price: '$3.20', label: 'Strong Second Choice' },
        { name: 'Highland Hope', rating: 198, price: '$4.50', label: 'Value Play' },
      ],
    },
    {
      number: 2,
      name: "Virgin Bet A Good Bet Mares' Maiden Hurdle",
      distance: '3978m',
      favorite: { name: 'Siorai', rating: 137, price: '$2.36' },
      contenders: [
        { name: 'Bella Vista', rating: 129, price: '$3.80', label: 'Improving Mare' },
        { name: 'Celtic Queen', rating: 125, price: '$4.20', label: 'Each-Way Chance' },
      ],
    },
    {
      number: 3,
      name: 'Virgin Bet Supports Safe Gambling Handicap Hurdle',
      distance: '3130m',
      favorite: { name: 'Inca Prince', rating: 133, price: '$2.97' },
      contenders: [
        { name: 'Mountain King', rating: 128, price: '$3.50', label: 'Well Handicapped' },
        { name: 'Valley Runner', rating: 124, price: '$5.00', label: 'Longshot Appeal' },
      ],
    },
    {
      number: 4,
      name: 'Time For Heroes Handicap Chase',
      distance: '4085m',
      favorite: { name: 'Divas Doyen', rating: 128, price: '$2.36' },
      contenders: [
        { name: 'Noble Warrior', rating: 122, price: '$3.90', label: 'Track Specialist' },
        { name: 'Thunder Jump', rating: 119, price: '$4.60', label: 'Fresh & Fit' },
      ],
    },
    {
      number: 5,
      name: 'Livescore Bet Handicap Hurdle',
      distance: '4791m',
      favorite: { name: 'Lelantos', rating: 114, price: '$3.59' },
      contenders: [
        { name: 'Marathon Man', rating: 110, price: '$4.20', label: 'Stayer Supreme' },
        { name: 'Last Chance', rating: 107, price: '$5.50', label: 'Improver' },
      ],
    },
    {
      number: 6,
      name: 'Famous Five Handicap Chase',
      distance: '4752m',
      favorite: { name: 'Jus De Citron', rating: 141, price: '$2.77' },
      contenders: [
        { name: 'Golden Fence', rating: 136, price: '$3.40', label: 'Solid Rival' },
        { name: 'Chase Master', rating: 132, price: '$4.80', label: 'Best of Rest' },
      ],
    },
    {
      number: 7,
      name: "Virgin Bet Conditional Jockeys' Handicap Hurdle",
      distance: '3978m',
      favorite: { name: 'Gemini Man', rating: 139, price: '$2.87' },
      contenders: [
        { name: 'Rising Star', rating: 133, price: '$3.70', label: 'Conditional Special' },
        { name: 'Young Gun', rating: 129, price: '$4.90', label: 'Outsider Threat' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-8 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/ttr-uk-ire-ratings"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-4"
          >
            <FiArrowLeft size={20} />
            <span>Back to Meetings</span>
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Musselburgh</h1>
              <p className="text-purple-200 text-lg">Saturday, February 15, 2026 • Jumps Racing</p>
              <p className="text-purple-300 text-sm mt-1">Scotland • 7 Races</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Race Cards */}
        <div className="space-y-8">
          {races.map((race) => (
            <div
              key={race.number}
              className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-purple-600"
            >
              {/* Race Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl font-bold">Race {race.number}</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                        {race.distance}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold">{race.name}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* TTR Model Favorite */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 mb-6 border-l-4 border-purple-600">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-purple-900 uppercase tracking-wide">
                      ⭐ TTR Model Favorite
                    </span>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-purple-900 mb-1">
                        {race.favorite.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-purple-700">
                          Rating: <span className="text-lg">{race.favorite.rating}</span>
                        </span>
                        <span className="font-semibold text-purple-700">
                          Price: <span className="text-lg">{race.favorite.price}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Contenders */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Top Contenders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {race.contenders.map((contender, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{contender.name}</h4>
                          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">
                            {contender.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Rating: <span className="font-semibold text-gray-900">{contender.rating}</span>
                          </span>
                          <span className="text-gray-600">
                            Price: <span className="font-semibold text-gray-900">{contender.price}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
