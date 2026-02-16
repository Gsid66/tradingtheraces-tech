import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { format, parseISO, isValid } from 'date-fns';

interface PageProps {
  params: Promise<{ date: string }>;
}

interface RaceData {
  number: number;
  name: string;
  track: string;
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

export default async function TTRAUNZRatingsPage({ params }: PageProps) {
  const { date } = await params;
  
  // Parse and format the date
  const parsedDate = parseISO(date);
  const formattedDate = isValid(parsedDate) 
    ? format(parsedDate, 'EEEE, MMMM d, yyyy')
    : 'Saturday, February 15, 2026';

  const races: RaceData[] = [
    {
      number: 1,
      name: 'Flemington Cup',
      track: 'Flemington',
      distance: '2400m',
      favorite: { name: 'Southern Cross', rating: 145, price: '$3.20' },
      contenders: [
        { name: 'Melbourne Magic', rating: 140, price: '$3.80', label: 'Form Horse' },
        { name: 'Victoria Star', rating: 137, price: '$4.50', label: 'Track Specialist' },
      ],
      analysis: `Southern Cross tops the TTR ratings at 145 in this prestigious Flemington feature. The horse has shown exceptional form on this track, with the 2400m distance playing to its stamina strengths. Melbourne Magic brings solid recent form and cannot be discounted in what shapes as a competitive affair. The Flemington straight is one of the longest in Australia, rewarding horses with a strong finishing burst. Southern Cross has the class edge and should prove too strong in the final 200 metres. Expect a tactical race with the pace picking up from the 600m mark.`,
    },
    {
      number: 2,
      name: 'Randwick Stakes',
      track: 'Randwick',
      distance: '1600m',
      favorite: { name: 'Sydney Express', rating: 138, price: '$2.90' },
      contenders: [
        { name: 'Harbour View', rating: 134, price: '$3.40', label: 'Consistent' },
        { name: 'Eastern Promise', rating: 131, price: '$4.20', label: 'Improver' },
      ],
      analysis: `Sydney Express is the clear TTR selection with a rating of 138 in this mile championship at Randwick. The horse has proven versatile in running styles and handles all track conditions. Harbour View presents the main threat with consistent recent efforts and tactical pace. The Randwick mile is a true test, requiring both speed and stamina. Positioning from the 800m will be crucial as horses jostle for clear running room. Sydney Express has the quality to control from midfield and should quicken decisively when balanced in the straight. This is a race for the patient jockey.`,
    },
    {
      number: 3,
      name: 'Eagle Farm Handicap',
      track: 'Eagle Farm',
      distance: '1800m',
      favorite: { name: 'Queensland King', rating: 132, price: '$3.10' },
      contenders: [
        { name: 'Brisbane Bay', rating: 128, price: '$3.70', label: 'Track Winner' },
        { name: 'Sunshine State', rating: 125, price: '$4.60', label: 'Each-Way Value' },
      ],
      analysis: `Queensland King dominates the TTR ratings at 132 in this middle-distance test at Eagle Farm. The horse's recent barrier trial suggests peak fitness, and the 1800m trip is ideal. Brisbane Bay has won at this track before and represents solid each-way value. The Eagle Farm circuit rewards horses that can sustain a strong tempo throughout. The key is to be in the first six at the 600m mark with momentum building. Queensland King's proven finishing power should see him surge clear in the final stages. The Brisbane weather could play a factor, so watch for any track condition changes.`,
    },
    {
      number: 4,
      name: 'Caulfield Guineas Trial',
      track: 'Caulfield',
      distance: '1400m',
      favorite: { name: 'Autumn Glory', rating: 126, price: '$2.80' },
      contenders: [
        { name: 'Spring Carnival', rating: 122, price: '$3.50', label: 'Well In' },
        { name: 'Rising Star', rating: 119, price: '$4.80', label: 'Unexposed' },
      ],
      analysis: `Autumn Glory gets the nod from TTR with a rating of 126 in this Guineas trial. The three-year-old has shown impressive maturity and the 1400m should suit perfectly. Spring Carnival cannot be underestimated given the favourable weight allocation for this grade. This is a crucial lead-up race for the spring carnival, and form here often translates to success in the bigger races. The Caulfield track can be tricky with its cambered turns, favouring horses with tactical speed. Autumn Glory has demonstrated the versatility to win from different positions and should prove too classy for these rivals.`,
    },
    {
      number: 5,
      name: 'Moonee Valley Sprint',
      track: 'Moonee Valley',
      distance: '1200m',
      favorite: { name: 'Valley Flash', rating: 129, price: '$2.70' },
      contenders: [
        { name: 'Lightning Strike', rating: 125, price: '$3.30', label: 'Speedster' },
        { name: 'Quick Fire', rating: 122, price: '$4.00', label: 'Gate Speed' },
      ],
      analysis: `Valley Flash is strongly fancied by TTR with a rating of 129 in this sprint feature at Moonee Valley. The tight turning track demands speed and agility, both qualities this horse possesses. Lightning Strike brings explosive early pace and could prove difficult to run down. Sprint racing at Moonee Valley is all about the start and maintaining momentum through the turns. The 400m home straight doesn't leave much room for error. Valley Flash has the necessary track experience and sustained speed to hold off all challengers. Expect a genuine speed battle from the outset with the winner likely coming from the front half of the field.`,
    },
    {
      number: 6,
      name: 'Rosehill Derby',
      track: 'Rosehill',
      distance: '2000m',
      favorite: { name: 'Derby Dream', rating: 141, price: '$2.60' },
      contenders: [
        { name: 'Classic Form', rating: 136, price: '$3.20', label: 'Stayer' },
        { name: 'Future Champion', rating: 133, price: '$4.40', label: 'Potential Star' },
      ],
      analysis: `Derby Dream is the standout TTR pick with an impressive rating of 141 in this classic staying test. The horse has shown progressive improvement with each run this preparation. Classic Form also brings legitimate staying credentials and could benefit from a strong pace scenario. The Rosehill 2000m starts on a chute and requires horses to balance quickly. The wide sweeping turn into the straight often sees the race unfold, with horses needing clear running room. Derby Dream has the tactical speed to position ideally from the barriers and the stamina to sustain a strong finish. This shapes as a crucial stepping stone to the autumn staying classics.`,
    },
    {
      number: 7,
      name: 'Doomben Cup Trial',
      track: 'Doomben',
      distance: '1650m',
      favorite: { name: 'Doomben Dash', rating: 135, price: '$2.85' },
      contenders: [
        { name: 'Eagle Scout', rating: 131, price: '$3.50', label: 'Consistent' },
        { name: 'Track Master', rating: 128, price: '$4.20', label: 'Local Hope' },
      ],
      analysis: `Doomben Dash leads the TTR ratings at 135 in this Cup trial at Doomben. The horse's recent form has been exceptional, with strong finishing efforts in quality races. Eagle Scout provides solid opposition with consistent placings in similar company. The Doomben 1650m requires both speed over the opening stages and stamina to sustain through the home straight. Track position will be crucial with the tight turning nature of this circuit. Doomben Dash has proven adept at navigating this course and should have the tactical speed to be prominent throughout. The winner will likely need to be within four lengths at the turn and have the finishing power to surge clear in the final 300 metres.`,
    },
    {
      number: 8,
      name: 'Adelaide Magic Millions',
      track: 'Adelaide',
      distance: '1100m',
      favorite: { name: 'Magic Moment', rating: 124, price: '$3.00' },
      contenders: [
        { name: 'Adelaide Ace', rating: 120, price: '$3.60', label: 'Speed Merchant' },
        { name: 'South Australian', rating: 117, price: '$4.50', label: 'Fresh' },
      ],
      analysis: `Magic Moment is marginally preferred by TTR with a rating of 124 in this sprint finale. The 1100m trip at Adelaide requires explosive early speed to handle the short run to the first turn. Adelaide Ace has shown excellent gate speed and will aim to control from the front. Sprint races at this distance are notoriously difficult to predict, with barrier draw and early positioning absolutely crucial. Any bumping or interference early can end winning chances immediately. Magic Moment has demonstrated the necessary gate speed and if jumping cleanly, should have enough tactical speed to position perfectly. Expect a thrilling finish to conclude an exciting day of Australian racing with several horses in contention at the 200m mark.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-green-700 text-white py-8 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/ttr-au-nz-ratings"
            className="inline-flex items-center gap-2 text-amber-200 hover:text-white transition-colors mb-4"
          >
            <FiArrowLeft size={20} />
            <span>Back to AU/NZ Ratings</span>
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">TTR AU/NZ Ratings</h1>
              <p className="text-amber-200 text-lg">{formattedDate} • Australian Racing</p>
              <p className="text-amber-300 text-sm mt-1">Australia & New Zealand • 8 Races</p>
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
              className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-amber-600"
            >
              {/* Race Header */}
              <div className="bg-gradient-to-r from-amber-600 to-green-700 text-white px-6 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl font-bold">Race {race.number}</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                        {race.distance}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                        {race.track}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold">{race.name}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* TTR Model Favorite */}
                <div className="bg-gradient-to-r from-amber-50 to-green-100 rounded-lg p-6 mb-6 border-l-4 border-amber-600">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                      ⭐ TTR Model Favorite
                    </span>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-amber-900 mb-1">
                        {race.favorite.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-amber-700">
                          Rating: <span className="text-lg">{race.favorite.rating}</span>
                        </span>
                        <span className="font-semibold text-amber-700">
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
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-amber-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{contender.name}</h4>
                          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">
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
                <div className="bg-gradient-to-br from-amber-600 to-green-700 rounded-xl p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl flex-shrink-0">🔍</div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        🔍 Sherlock&apos;s Analysis
                      </h3>
                      <p className="text-amber-100 leading-relaxed">{race.analysis}</p>
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
