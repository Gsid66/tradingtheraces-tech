import { FaGift, FaCalendarDay, FaChartLine, FaMapMarkedAlt, FaGem } from 'react-icons/fa'

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
        <a href="/today" className="quick-link-card">
          <div className="quick-link-icon">
            <FaCalendarDay />
          </div>
          <h3>Today's Races</h3>
          <p>View all races scheduled for today</p>
        </a>

        <a href="/results" className="quick-link-card">
          <div className="quick-link-icon">
            <FaChartLine />
          </div>
          <h3>Recent Results</h3>
          <p>Check latest race results</p>
        </a>

        <a href="/tracks" className="quick-link-card">
          <div className="quick-link-icon">
            <FaMapMarkedAlt />
          </div>
          <h3>Track Information</h3>
          <p>View track details and conditions</p>
        </a>
      </div>

      {/* Premium Banner */}
      <div 
        className="info-banner" 
        style={{ 
          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', 
          marginTop: '2rem' 
        }}
      >
        <div className="info-banner-icon">
          <FaGem />
        </div>
        <div className="info-banner-content">
          <h3>Want More Premium Content?</h3>
          <p>
            Join our Members Portal for exclusive race reports, advanced tools, and comprehensive lessons
          </p>
        </div>
      </div>

      <div style={{ textAlign:  'center', marginTop: '1.5rem' }}>
        <a 
          href="/members" 
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            textDecoration:  'none',
            fontWeight: 600,
            fontSize:  '1.1rem',
            boxShadow: '0 4px 12px rgba(245,87,108,0.3)',
            transition: 'transform 0.2s ease'
          }}
        >
          Access Members Portal →
        </a>
      </div>
    </>
  )
}