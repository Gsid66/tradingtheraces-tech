import Link from 'next/link'
import { FaHome, FaChartLine, FaCalendarAlt, FaCalculator, FaClipboardList } from 'react-icons/fa'

export default function NavigationCards() {
  return (
    <div className="quick-links-section">
      <div className="quick-links-grid">
        <Link href="/" className="quick-link-card quick-link-card-active">
          <div className="quick-link-icon">
            <FaHome />
          </div>
          <h3>Home Page</h3>
          <p>Return to main site</p>
        </Link>

        <Link href="/form-guide" className="quick-link-card">
          <div className="quick-link-icon">
            <FaChartLine />
          </div>
          <h3>Live TTR Ratings</h3>
          <p>Real-time race ratings</p>
        </Link>

        <div className="quick-link-card quick-link-card-coming-soon">
          <div className="quick-link-icon">
            <FaClipboardList />
          </div>
          <h3>Race Fields Hub</h3>
          <p>Coming Soon</p>
        </div>

        <div className="quick-link-card quick-link-card-coming-soon">
          <div className="quick-link-icon">
            <FaCalendarAlt />
          </div>
          <h3>TAB Meetings</h3>
          <p>Coming Soon</p>
        </div>

        <div className="quick-link-card quick-link-card-coming-soon">
          <div className="quick-link-icon">
            <FaCalculator />
          </div>
          <h3>Betting Calculator</h3>
          <p>Coming Soon</p>
        </div>
      </div>
    </div>
  )
}
