import Image from 'next/image'
import { FaCrown, FaGlobeAsia, FaGlobeEurope, FaChartLine } from 'react-icons/fa'
import NavigationCards from '@/components/NavigationCards'
import UpcomingRacesWrapper from '@/components/UpcomingRacesWrapper'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      {/* Trading Desk Login Banner - Scrolling Marquee - MUST BE FIRST */}
      <div className="mt-4 sm:mt-8 mb-4 sm:mb-8">
        <div style={{ background: 'linear-gradient(135deg, #1a0033 0%, #000000 100%)' }} className="rounded-lg shadow-lg overflow-hidden">
          <div className="py-3 sm:py-4 px-4 sm:px-6">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-white text-sm sm:text-xl font-bold">
                🔓 Log In to the TTR Trading Desk for free! Password: ttruser2026 🔓 Log In to the TTR Trading Desk for free! Password: ttruser2026 🔓 Log In to the TTR Trading Desk for free! Password: ttruser2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards - MUST BE SECOND */}
      <NavigationCards />

      {/* Main Page Image */}
      <div className="mt-6 sm:mt-8 mb-6 sm:mb-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 motion-safe:animate-pulse"></div>
          <div className="relative">
            <Image
              src="/images/ttr-main-page.png"
              alt="Trading the Races"
              width={1400}
              height={400}
              className="w-full h-auto rounded-lg shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Upcoming Races */}
      <div className="mt-12">
        <UpcomingRacesWrapper />
      </div>

      {/* Coming Soon Cards - ONLY 3 AT BOTTOM */}
      <div className="coming-soon-grid mt-12">
        <div className="coming-soon-card">
          <div className="coming-soon-icon">
            <FaGlobeAsia />
          </div>
          <h4>Coming Soon</h4>
          <p>AU Data Base</p>
        </div>
        <div className="coming-soon-card">
          <div className="coming-soon-icon">
            <FaGlobeEurope />
          </div>
          <h4>Coming Soon</h4>
          <p>UK Data Base</p>
        </div>
        <div className="coming-soon-card">
          <div className="coming-soon-icon">
            <FaChartLine />
          </div>
          <h4>Available Now!</h4>
          <p>Trading Desk</p>
        </div>
      </div>

      {/* Premium Banner */}
      <div 
        className="info-banner mt-12" 
        style={{ 
          background: 'linear-gradient(135deg, #111013 0%, #0c0b0e 100%)',
          border: '2px solid #fbbf24',
        }}
      >
        <div className="info-banner-icon" style={{ color: '#fbbf24' }}>
          <FaCrown />
        </div>
        <div className="info-banner-content">
          <h3>Want More Premium Content?</h3>
          <p>
            Join our Discord Members Chat for exclusive race reports, advanced tools, and comprehensive lessons. Coming soon! Run queries against our full historical database and access premium AI tools. 
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center mt-6 sm:mt-8 mb-8 sm:mb-12 fold-safe-area">
        <a 
          href="https://discord.gg/TawzRkQZgB" 
          className="gold-button"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #0a0803 0%, #0a0803 100%)',
            color: '#eae4f0',
            padding: '1rem 2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
            transition: 'transform 0.2s ease',
            border: '2px solid #fbbf24'
          }}
        >
          Access Discord Members Chat →
        </a>
      </div>
    </div>
  )
}