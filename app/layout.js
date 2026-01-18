import './globals.css';

export const metadata = {
  title: "Trading the Races",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header style={{ backgroundColor: 'purple', color: 'white', padding: '20px' }}>
          <h1>🏇 Trading the Races 🏇</h1>
          <nav>
            <ul style={{ listStyle: 'none', display: 'flex', justifyContent: 'space-around' }}>
              <li><a href="#race-cards">Race Cards Ratings</a></li>
              <li><a href="#tab-meetings">TAB Meetings</a></li>
              <li><a href="#betting-calculator">Betting Calculator</a></li>
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <footer style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>© 2026 Trading the Races. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}