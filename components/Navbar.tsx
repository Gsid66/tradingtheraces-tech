'use client';
import { useState } from 'react';
import NavigationLink from '@/components/NavigationLink';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 shadow-lg relative z-30">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Responsive Logo */}
        <NavigationLink href="/" className="text-white font-bold hover:text-gray-200 transition" onClick={closeMobileMenu}>
          <span className="text-xl lg:text-2xl">
            <span className="inline lg:hidden">🏇 TTR</span>
            <span className="hidden lg:inline">🏇 Trading the Races</span>
          </span>
        </NavigationLink>

        {/* Desktop Navigation (hidden on mobile) */}
        <div className="hidden lg:flex space-x-6">
          <NavigationLink href="/" className="text-white hover:text-gray-300 transition">Home</NavigationLink>
          <NavigationLink href="/form-guide" className="text-white hover:text-gray-300 transition">Live Ratings</NavigationLink>
          <NavigationLink href="/ratings-odds-comparison" className="text-white hover:text-gray-300 transition">Ratings vs Odds</NavigationLink>
          <NavigationLink href="/trading-desk" className="text-white hover:text-gray-300 transition">Trading Desk</NavigationLink>
          <NavigationLink href="/calculator" className="text-white hover:text-gray-300 transition">Calculator</NavigationLink>
          <a href="https://discord.gg/TawzRkQZgB" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 transition">Discord</a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? (
            <span className="text-2xl leading-none">✕</span>
          ) : (
            <span className="text-2xl leading-none">☰</span>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Semi-transparent backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
            role="presentation"
          />

          {/* Slide-out menu panel */}
          <div
            id="mobile-menu"
            className="fixed top-0 right-0 h-full w-64 bg-gradient-to-b from-purple-900 to-indigo-900 z-50 lg:hidden shadow-xl flex flex-col"
            role="dialog"
            aria-label="Mobile navigation menu"
            aria-modal="true"
          >
            {/* Close button row */}
            <div className="flex justify-end p-4">
              <button
                onClick={closeMobileMenu}
                className="text-white text-2xl p-2 rounded focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Menu items */}
            <nav className="flex flex-col px-4 gap-1">
              <NavigationLink
                href="/"
                className="text-white hover:text-gray-300 hover:bg-white/10 transition px-4 py-3 rounded-lg min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Home
              </NavigationLink>
              <NavigationLink
                href="/form-guide"
                className="text-white hover:text-gray-300 hover:bg-white/10 transition px-4 py-3 rounded-lg min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Live Ratings
              </NavigationLink>
              <NavigationLink
                href="/ratings-odds-comparison"
                className="text-white hover:text-gray-300 hover:bg-white/10 transition px-4 py-3 rounded-lg min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Ratings vs Odds
              </NavigationLink>
              <NavigationLink
                href="/trading-desk"
                className="text-white hover:text-gray-300 hover:bg-white/10 transition px-4 py-3 rounded-lg min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Trading Desk
              </NavigationLink>
              <NavigationLink
                href="/calculator"
                className="text-white hover:text-gray-300 hover:bg-white/10 transition px-4 py-3 rounded-lg min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Calculator
              </NavigationLink>
              <a
                href="https://discord.gg/TawzRkQZgB"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 hover:bg-white/10 transition px-4 py-3 rounded-lg min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Discord
              </a>
            </nav>
          </div>
        </>
      )}
    </nav>
  );
}