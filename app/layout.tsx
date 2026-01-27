import './globals.css'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export const metadata = {
  title: 'Trading the Races - Unlock Winning Strategies',
  description: 'Professional racing data, ratings, and analysis for horse and greyhound racing',
  icons: {
    icon: '/images/ttr-logo.png',
    apple: '/images/ttr-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Top Navigation Bar */}
        <Navigation />
        
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
