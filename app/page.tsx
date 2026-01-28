import { FaGift, FaCrown } from 'react-icons/fa'
import RaceCarousel from './components/RaceCarousel'

export default function Home() {
  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1>Welcome to Trading the Races</h1>
        <p className="page-subtitle">
          Professional racing data, ratings, and analysis for horse and greyhound racing
        </p>
      </div>

      {/* RACE CAROUSEL - THE MAIN FEATURE */}
      <RaceCarousel />

      {/* Coming Soon Cards */}
      <div className="coming-soon-grid">
        <div className="coming-soon-card">
          <h4>Coming Soon</h4>
          <p>More features</p>
        </div>
        <div className="coming-soon-card">
          <h4>Coming Soon</h4>
          <p>More features</p>
        </div>
        <div className="coming-soon-card">
          <h4>Coming Soon</h4>
          <p>More features</p>
        </div>
        <div className="coming-soon-card">
          <h4>Coming Soon</h4>
          <p>More features</p>
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
            Join our Members Portal for exclusive race reports, advanced tools, and comprehensive lessons
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <a 
          href="/members" 
          className="gold-button"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            color: '#1a0033',
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
          Access Members Portal →
        </a>
      </div>
    </>
  )
}