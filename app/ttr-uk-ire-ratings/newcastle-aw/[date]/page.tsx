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
  analysis: string;
}

export default async function NewcastleAWPage({ params }: PageProps) {
  const { date } = await params;

  const races: RaceData[] = [
    {
      number: 1,
      name: 'Midnite A Next Generation Betting App Handicap',
      distance: '2049m',
      favorite: { name: 'Masham Moor', rating: 142, price: '$3.07' },
      contenders: [
        { name: 'Digital Dawn', rating: 138, price: '$3.60', label: 'Form Horse' },
        { name: 'Tech Runner', rating: 135, price: '$4.20', label: 'Track Winner' },
      ],
      analysis: `Masham Moor heads the TTR ratings at 142 in this competitive opener. The all-weather surface should suit perfectly, and recent runs suggest the horse is primed for a big effort. Digital Dawn brings solid recent form and handles the synthetic track well. This distance on the Tapeta requires both speed and stamina. Expect a strong pace from the outset, with the principals coming from midfield. Masham Moor's class advantage should prove decisive in the straight.`,
    },
    {
      number: 2,
      name: 'Make The Move To Midnite Handicap',
      distance: '3269m',
      favorite: { name: 'Billy Bathgate', rating: 134, price: '$2.87' },
      contenders: [
        { name: 'Extended Play', rating: 129, price: '$3.50', label: 'Stayer' },
        { name: 'Marathon Mood', rating: 126, price: '$4.80', label: 'Each-Way Value' },
      ],
      analysis: `Billy Bathgate is the clear TTR selection with a rating of 134 in this extended trip handicap. The horse has shown a liking for marathon distances and the all-weather surface. Extended Play represents the main danger with proven stamina credentials. This race will be won by the horse that settles best and has energy reserves for the long straight. Tactical awareness from the jockey will be crucial. Billy Bathgate's experience at this trip gives him a clear edge.`,
    },
    {
      number: 3,
      name: 'Join The Midnite Movement Handicap (Div I)',
      distance: '2504m',
      favorite: { name: 'Duchess', rating: 124, price: '$2.56' },
      contenders: [
        { name: 'Royal Entry', rating: 120, price: '$3.80', label: 'Consistent' },
        { name: 'Class Act', rating: 117, price: '$4.50', label: 'Improver' },
      ],
      analysis: `Duchess dominates the TTR ratings at 124 in the first division of this split handicap. Her all-weather form figures are excellent, and she's proven at this track and trip. Royal Entry has been knocking on the door and represents a solid each-way alternative. The mid-distance on the all-weather often produces tight finishes. Positioning will be key entering the home turn. Duchess should have too much speed for these rivals once balanced in the straight.`,
    },
    {
      number: 4,
      name: 'Join The Midnite Movement Handicap (Div II)',
      distance: '2504m',
      favorite: { name: 'Havachoc', rating: 115, price: '$3.28' },
      contenders: [
        { name: 'Split Decision', rating: 112, price: '$3.90', label: 'Well In' },
        { name: 'Double Dash', rating: 109, price: '$5.20', label: 'Longshot' },
      ],
      analysis: `Havachoc gets the nod from TTR with a rating of 115 in the second division. The draw looks favorable, and recent form suggests readiness to strike. Split Decision cannot be underestimated given his favorable weight allocation. This appears more open than the first division, with several lightly-raced types capable of improvement. The pace should be solid throughout. Havachoc's tactical speed from the gates could prove the difference in what may be a tactical affair.`,
    },
    {
      number: 5,
      name: 'Bet 10 Get 40 With Betmgm Classified Stakes',
      distance: '1614m',
      favorite: { name: 'Can Boogy', rating: 126, price: '$2.46' },
      contenders: [
        { name: 'Dance Floor', rating: 122, price: '$3.20', label: 'Speedster' },
        { name: 'Quick Step', rating: 119, price: '$4.60', label: 'Fresh' },
      ],
      analysis: `Can Boogy is strongly fancied by TTR with a rating of 126 in this classified stakes. The horse has excelled over this trip on the all-weather and arrives in peak form. Dance Floor brings speed to the equation and could set the pace. The middle-distance sprint requires balanced pace judgment - go too fast early and fade, too slow and you're swamped late. Can Boogy's experience in these conditions should see him time his run to perfection. Expect him to be traveling best entering the final furlong.`,
    },
    {
      number: 6,
      name: 'Always Gamble Responsibly At Betmgm Handicap',
      distance: '1421m',
      favorite: { name: 'Tasever', rating: 116, price: '$3.07' },
      contenders: [
        { name: 'Sprint Star', rating: 113, price: '$3.80', label: 'Gate Speed' },
        { name: 'Fast Track', rating: 110, price: '$5.00', label: 'Outsider' },
      ],
      analysis: `Tasever leads the TTR ratings at 116 in this seven-furlong handicap. The trip suits perfectly, and the all-weather surface plays to strengths. Sprint Star has early pace and could look to control from the front. This distance often produces thrilling finishes at Newcastle, with those covering ground from off the pace often successful. The key is to have a clear run in the straight. Tasever's class and finishing kick should prevail in a driving finish.`,
    },
    {
      number: 7,
      name: "Win 250,000 With Betmgm's Golden Goals Restricted Novice Stakes",
      distance: '1614m',
      favorite: { name: 'L L Koulsty', rating: 147, price: '$2.56' },
      contenders: [
        { name: 'Novice King', rating: 141, price: '$3.40', label: 'Unexposed' },
        { name: 'Learning Fast', rating: 137, price: '$4.80', label: 'Potential Star' },
      ],
      analysis: `L L Koulsty is the standout TTR pick with an impressive rating of 147 in this restricted novice event. The form shown to date suggests significant untapped potential. Novice King also looks above average and could benefit from this experience. Restricted novice stakes often reveal future stars, and this looks a strong renewal. The all-weather surface helps inexperienced horses find their rhythm. L L Koulsty has the class to dominate and should quicken clear when asked in the final two furlongs.`,
    },
    {
      number: 8,
      name: 'Midnite Are Upping The Betting Game Handicap',
      distance: '1005m',
      favorite: { name: 'Em Jay Kay', rating: 92, price: '$5.64' },
      contenders: [
        { name: 'Lightning Bolt', rating: 89, price: '$6.20', label: 'Speed Merchant' },
        { name: 'Flash Point', rating: 86, price: '$7.50', label: 'Consistent' },
      ],
      analysis: `Em Jay Kay is marginally preferred by TTR with a rating of 92 in this competitive sprint finale. The five-furlong dash requires explosive speed from the stalls. Lightning Bolt is aptly named and will aim to lead throughout if possible. Sprint handicaps over this minimum trip are notoriously difficult to predict, with draw and early positioning crucial. Any interference early spells disaster. Em Jay Kay has shown the necessary gate speed and if he jumps cleanly, should have enough pace to hold off late challengers. Expect a thrilling finish to conclude the card.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/ttr-uk-ire-ratings"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-4"
          >
            <FiArrowLeft size={20} />
            <span>Back to Meetings</span>
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Newcastle AW</h1>
              <p className="text-blue-200 text-lg">Saturday, February 15, 2026 • Flat Racing</p>
              <p className="text-blue-300 text-sm mt-1">England • 8 Races</p>
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
              className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-600"
            >
              {/* Race Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
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
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6 border-l-4 border-blue-600">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                      ⭐ TTR Model Favorite
                    </span>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-blue-900 mb-1">
                        {race.favorite.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-blue-700">
                          Rating: <span className="text-lg">{race.favorite.rating}</span>
                        </span>
                        <span className="font-semibold text-blue-700">
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
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{contender.name}</h4>
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
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
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl flex-shrink-0">🔍</div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        🔍 Sherlock&apos;s Analysis
                      </h3>
                      <p className="text-blue-100 leading-relaxed">{race.analysis}</p>
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
