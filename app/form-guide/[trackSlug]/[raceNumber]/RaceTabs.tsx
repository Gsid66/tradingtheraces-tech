'use client';

import { useState } from 'react';

const tabs = [
  { id: 'form', label: 'Form', available: true },
  { id: 'ratings-odds', label: 'Ratings/Odds', available: true },
  { id: 'analysis', label: 'Analysis', available: false },
  { id: 'trading-desk', label: 'Trading Desk', available: true },
  { id: 'sherlock-hooves', label: 'Sherlock Hooves AI', available: false },
];

interface Props {
  onTabChange?: (tabId: string) => void;
}

export default function RaceTabs({ onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState('form');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonTab, setComingSoonTab] = useState('');

  const handleTabClick = (tabId: string, available: boolean) => {
  if (!available) {
    setComingSoonTab(tabId);
    setShowComingSoon(true);
  } else {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  }
};

  return (
    <>
      <div className="bg-white rounded-t-lg border-b mt-6">
        <div className="flex gap-6 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.available)}
              className={`relative px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-green-600 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {! tab.available && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowComingSoon(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Coming Soon!
              </h3>
              <p className="text-gray-600 mb-6">
                The <strong>{tabs. find(t => t.id === comingSoonTab)?.label}</strong> feature is currently under development.  
                Stay tuned for updates!
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full px-6 py-3 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}