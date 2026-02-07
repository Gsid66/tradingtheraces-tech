import Image from 'next/image'
import { FaCrown, FaGlobeAsia, FaGlobeEurope, FaChartLine } from 'react-icons/fa'
import NavigationCards from '@/components/NavigationCards'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Navigation Cards */}
      <NavigationCards />

      {/* Page Header */}
      <div className="page-header mx-auto max-w-4xl mt-8">
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

      {/* Coming Soon Cards */}
      <div className="coming-soon-grid max-w-6xl mx-auto mt-12">
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
          <h4>Coming Soon</h4>
          <p>Trading Desk</p>
        </div>
        

      {/* Premium Banner */}
      <div 
        className="info-banner max-w-4xl mx-auto mt-12" 
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
<<<<<<< HEAD
      </div>
    </>
=======
    </div>
>>>>>>> 1e6c84f329c7e3cefdfb4233402490ab9757a9c1
  )
}