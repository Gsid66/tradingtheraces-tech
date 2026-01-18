import { FaGift, FaCalendarDay, FaChartLine, FaMapMarkedAlt, FaCrown } from 'react-icons/fa'

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

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-banner-icon">
          <FaGift />
        </div>
        <div className="info-banner-content">
          <h3>Real-Time Racing Data Platform</h3>
          <p>
            Access live race ratings, comprehensive analysis, and professional betting tools
          </p>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="quick-links-grid" style={{ marginTop: '2rem' }}>
        <div className="quick-link-card">
          <div className="quick-link-icon">
            <FaCalendarDay />
          </div>
          <h3>Today's Races</h3>
          <p>View all races scheduled for today</p>
        </div>

        <div className="quick-link-card">
          <div className="quick-link-icon">
            <FaChartLine />
          </div>
          <h3>Recent Results</h3>
          <p>Check latest race results</p>
        </div>

        <div className="quick-link-card">
          <div className="quick-link-icon">
            <FaMapMarkedAlt />
          </div>
          <h3>Track Information</h3>
          <p>View track details and conditions</p>
        </div>
      </div>

      {/* Premium Banner - GOLD/PURPLE GRADIENT */}
      <div 
        className="info-banner" 
        style={{ 
          background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
          border: '2px solid #fbbf24',
          marginTop:  '2rem' 
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

      {/* CTA Button - GOLD THEME */}
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