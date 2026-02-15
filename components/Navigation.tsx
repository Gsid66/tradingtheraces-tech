'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Generate today's date in Australia/Sydney timezone (memoized)
  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { 
      timeZone: 'Australia/Sydney' 
    });
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/form-guide', label: 'Form Guide' },
    { href: '/results', label: 'Results' },
    { href: '/trading-desk', label: 'Trading Desk' },
    { href: '/ratings-odds-comparison', label: 'Ratings vs Odds' },
    { href: '/ttr-uk-ire-ratings/', label: 'TTR UK Ratings' },
    { href: '/calculator', label: 'Calculator' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-purple-900 border-b-2 border-purple-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="bg-white rounded-lg p-1">
              <Image
                src="/images/ttr-logo.png"
                alt="Trading the Races Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">Trading the Races</span>
            <span className="text-xl font-bold text-white sm:hidden">TTR</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'text-purple-200 bg-purple-800'
                    : 'text-purple-300 hover:text-white hover:bg-purple-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 rounded-md hover:bg-purple-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive(link.href)
                      ? 'text-purple-200 bg-purple-800'
                      : 'text-purple-300 hover:text-white hover:bg-purple-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
