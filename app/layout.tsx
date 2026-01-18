import './globals.css'
import Link from 'next/link'
import { FaHome, FaChartLine, FaCalendarAlt, FaCalculator, FaClipboardList } from 'react-icons/fa'

export const metadata = {
  title: 'Trading the Races - Horse & Greyhound Racing Data Platform',
  description: 'Real-time racing data, ratings, and analysis for horse and greyhound racing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Card-Based Navigation */}
        <div className="quick-links-section">
          <div className="quick-links-grid">
            <Link href="/" className="quick-link-card">
              <div className="quick-link-icon">
                <FaHome />
              </div>
              <h3>Home Page</h3>
              <p>Return to main site</p>
            </Link>

            <Link href="/race-viewer" className="quick-link-card">
              <div className="quick-link-icon">
                <FaChartLine />
              </div>
              <h3>Live TTR Ratings</h3>
              <p>Real-time race ratings</p>
            </Link>

            <Link href="/race-fields" className="quick-link-card">
              <div className="quick-link-icon">
                <FaClipboardList />
              </div>
              <h3>Race Fields Hub</h3>
              <p>Official fields & guides</p>
            </Link>

            <Link href="/tab-meetings" className="quick-link-card">
              <div className="quick-link-icon">
                <FaCalendarAlt />
              </div>
              <h3>TAB Meetings</h3>
              <p>Today's meetings</p>
            </Link>

            <Link href="/calculator" className="quick-link-card">
              <div className="quick-link-icon">
                <FaCalculator />
              </div>
              <h3>Betting Calculator</h3>
              <p>Calculate returns</p>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="container">
          {children}
        </div>

        {/* Footer */}
        <footer>
          <p style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Trading The Races
          </p>
          <p style={{ opacity: 0.95 }}>
            Professional Race Analysis & TTR Ratings
          </p>
          <p style={{ marginTop: '1. 5rem' }}>
            <Link href="/" className="footer-link">Main Website</Link> | 
            <Link href="/race-viewer" className="footer-link">TTR Ratings</Link> |
            <Link href="/members" className="footer-link">Members Portal</Link>
          </p>
          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.85 }}>
            Updated Daily with Fresh Analysis
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.75 }}>
            © 2026 Trading The Races.  All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  )
}
