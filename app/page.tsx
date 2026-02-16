import Image from 'next/image'
import { FaCrown, FaGlobeAsia, FaGlobeEurope, FaChartLine } from 'react-icons/fa'
import NavigationCards from '@/components/NavigationCards'
import UpcomingRacesWrapper from '@/components/UpcomingRacesWrapper'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Navigation Cards */}
      <NavigationCards />

      {/* Trading Desk Login Banner */}
      <div className="mt-8 mb-8">
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 rounded-lg shadow-lg border-2 border-purple-400 overflow-hidden">
          <div className="py-4 px-6">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-white text-xl font-bold">
                🔓 Log In to the TTR Trading Desk for free! Password: ttruser2026 🔓 Log In to the TTR Trading Desk for free! Password: ttruser2026 🔓 Log In to the TTR Trading Desk for free! Password: ttruser2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Image */}
      <div className="mt-8 mb-8">
        <div className="relative w-full rounded-lg overflow-hidden">
          <Image
            src="/images/ttr-mainpage.png"
            alt="Trading the Races"
            width={1400}
            height={600}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      {/* Upcoming Races */}
      <div className="mt-12">
        <UpcomingRacesWrapper />
      </div>

      {/* Coming Soon Cards */}
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
          background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
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
      <div className="text-center mt-8 mb-12">
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