import Link from 'next/link';
import Image from 'next/image';
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
  analysis: string;
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
      analysis: `Fantasy World stands out as the clear TTR Model Favorite with an impressive rating of 218. The horse has shown consistent form over similar distances and should handle the Musselburgh track well. Desert Dreamer offers solid value as a backup option with a rating of 205, particularly if track conditions favor front-runners. The key to this race will be early positioning, as the winner typically establishes control before the final hurdle.`,
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
      analysis: `Siorai emerges as the TTR favorite in this mares' contest, carrying a rating of 137 into what looks a winnable assignment. She has been knocking on the door in recent starts and this trip should suit perfectly. Bella Vista represents danger as an improving type who could appreciate the step up in distance. The extended journey will test stamina reserves, making this an intriguing tactical battle where patient riding could prove decisive.`,
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
      analysis: `Inca Prince heads the TTR ratings at 133 in this competitive handicap hurdle. His recent form figures suggest he's ready to peak, and the return to this distance looks a positive move. Mountain King cannot be dismissed lightly given his favorable handicap mark and proven ability at the track. This shapes as a genuine test of handicapping skill, with the pace likely to be honest throughout. Expect the principals to be fighting it out from the last flight.`,
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
      analysis: `Divas Doyen is the standout selection according to TTR ratings (128), bringing strong chase form into this contest. The extended trip plays to his strengths, and his jumping has been clean in recent outings. Noble Warrior knows Musselburgh well and could pose problems if allowed to dictate terms. The key factor here is fence jumping - any mistakes could prove costly over this stamina-sapping distance. Look for Divas Doyen to assert from three out.`,
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
      analysis: `Lelantos takes favoritism in this marathon hurdle with a TTR rating of 114. The extreme distance should suit this genuine stayer who has shown he relishes a test of stamina. Marathon Man lives up to his name and will ensure a true gallop from the outset. This is all about staying power and maintaining jumping rhythm over nearly three miles. The winner will likely emerge from the final half-mile, with tactical positioning crucial entering the home straight.`,
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
      analysis: `Jus De Citron commands respect with a TTR rating of 141, the highest on the card. His chase credentials are strong, and he's proven over this demanding trip. Golden Fence rates a genuine threat and could exploit any jumping errors from the favorite. This marathon chase will be a war of attrition, with fitness and fence accuracy paramount. Expect a tactical affair where the winner preserves energy for a late challenge. Jus De Citron's class should tell in the closing stages.`,
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
      analysis: `Gemini Man is the clear TTR favorite with a rating of 139 in this conditional jockeys' contest. The handicapper has him well treated, and the booking of an up-and-coming claimer looks astute. Rising Star brings strong recent form and could benefit from the weight allowance. This race often produces surprises as inexperienced riders navigate the pressure. The key will be maintaining composure over the final hurdle where mistakes often occur. Gemini Man's experience gives him the edge.`,
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

                {/* Sherlock's Analysis */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src="/images/sh-image-round.png"
                        alt="Sherlock Hooves"
                        fill
                        className="object-contain drop-shadow-lg"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        🔍 Sherlock&apos;s Analysis
                      </h3>
                      <p className="text-purple-100 leading-relaxed">{race.analysis}</p>
                    </div>
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
