import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiDownload } from 'react-icons/fi';

export default function TTRLandingPage() {
  // Today's date for 2026-02-15
  const today = '2026-02-15';
  
  const meetings = [
    {
      id: 'musselburgh',
      name: 'Musselburgh',
      location: 'Scotland',
      type: 'Jumps',
      raceCount: 7,
      link: `/ttr-uk-ire-ratings/musselburgh/${today}`,
      gradient: 'from-purple-600 to-purple-800',
      hoverGradient: 'hover:from-purple-700 hover:to-purple-900',
    },
    {
      id: 'newcastle-aw',
      name: 'Newcastle AW',
      location: 'England',
      type: 'Flat',
      raceCount: 8,
      link: `/ttr-uk-ire-ratings/newcastle-aw/${today}`,
      gradient: 'from-blue-600 to-blue-800',
      hoverGradient: 'hover:from-blue-700 hover:to-blue-900',
    },
  ];

  const totalRaces = meetings.reduce((sum, m) => sum + m.raceCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white py-8 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">TTR UK/IRE Ratings</h1>
              <p className="text-purple-200 text-lg">Saturday, February 15, 2026</p>
            </div>
            <Link
              href={`/ttr-uk-ire-ratings/${today}`}
              className="inline-flex items-center gap-2 bg-white text-purple-900 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
            >
              <FiDownload size={20} />
              <span>Download Today&apos;s File</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-600">
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Total Meetings
            </div>
            <div className="text-4xl font-bold text-purple-600">{meetings.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Total Races
            </div>
            <div className="text-4xl font-bold text-blue-600">{totalRaces}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Status
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-2xl font-bold text-green-600">Live</span>
            </div>
          </div>
        </div>

        {/* Meeting Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Today&apos;s Race Meetings</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={meeting.link}
                className={`bg-gradient-to-br ${meeting.gradient} ${meeting.hoverGradient} rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
              >
                <div className="p-8">
                  {/* Meeting Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">{meeting.name}</h3>
                      <p className="text-white/80 text-lg">{meeting.location}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <div className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                        {meeting.type}
                      </div>
                    </div>
                  </div>

                  {/* Sherlock Hooves Image */}
                  <div className="flex items-center justify-center mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="relative w-40 h-40">
                      <Image
                        src="/images/s-h-image.png"
                        alt="Sherlock Hooves AI"
                        fill
                        className="object-contain drop-shadow-2xl"
                      />
                    </div>
                  </div>

                  {/* Race Count & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">
                        Races Today
                      </div>
                      <div className="text-4xl font-bold text-white">{meeting.raceCount}</div>
                    </div>
                    <div className="bg-white text-gray-900 rounded-full p-4 shadow-lg">
                      <FiArrowRight size={24} />
                    </div>
                  </div>

                  {/* Sherlock's Insight Badge */}
                  <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src="/images/s-h-image.png"
                          alt="Sherlock Hooves"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="text-white text-sm">
                        <span className="font-bold">Sherlock Hooves Analysis:</span> Detailed AI-powered
                        insights for every race
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src="/images/s-h-image.png"
                alt="Sherlock Hooves"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                About Sherlock Hooves AI Analysis
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Each race features comprehensive analysis from Sherlock Hooves, our AI racing expert.
                Get detailed insights on TTR Model Favorites, top contenders, and strategic betting
                angles for every race across all tracks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
