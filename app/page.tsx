import Image from 'next/image'
import { FaGift, FaCrown } from 'react-icons/fa'
import UpcomingRaces from './components/UpcomingRaces'
import NavigationCards from '@/components/NavigationCards'

export default function Home() {
  return (
    <>
      {/* Navigation Cards */}
      <NavigationCards />

      {/* Page Header */}
      <div className="page-header">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/ttr-logo.png"
            alt="Trading the Races Logo"
            width={200}
            height={200}
            className="w-32 h-32 md:w-48 md:h-48 object-contain"
            priority
          />
        </div>
        
        <h1>Welcome to Trading the Races</h1>
        <p className="page-subtitle">
          Professional racing data, ratings, and analysis for horse and greyhound racing
        </p>
      </div>

      {/* UPCOMING RACES - THE MAIN FEATURE */}
      <UpcomingRaces />

      {/* Coming Soon Cards */}
      <div className="coming-soon-grid">
        <div className="coming-soon-card">
          <h4>Coming Soon</h4>
          <p>AU Data Base</p>
        </div>
        <div className="coming-soon-card">
          <h4>Coming Soon</h4>
          <p>UK Data Base</p>
        </div>
        <div className="coming-soon-card">
          <h4>Coming Soon</h4>
          <p>Trading Desk</p>
        </div>
        <div className="coming-soon-card">
          <div className="flex items-center gap-3 mb-2">
            <Image 
              src="/images/new-sherlock-hooves.png"
              alt="Sherlock Hooves"
              width={64}
              height={64}
              className="rounded-full border-4 border-purple-400 shadow-lg"
            />
            <h4>Available Now</h4>
          </div>
          <p>Sherlock-Hooves AI Agent</p>
          <p className="text-sm text-purple-600 mt-2">Professional race analysis</p>
        </div>
      </div>

      {/* Premium Banner */}
      <div 
        className="info-banner" 
        style={{ 
          background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
          border: '2px solid #fbbf24',
          marginTop: '2rem' 
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
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
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
    </>
  )
}