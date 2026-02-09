'use client'

import dynamic from 'next/dynamic'

// Dynamic import for UpcomingRaces to avoid hydration mismatch
// The component uses Date/time calculations that differ between server and client
const UpcomingRaces = dynamic(() => import('@/app/components/UpcomingRaces'), {
  ssr: false,
  loading: () => (
    <div className="upcoming-races-container text-center p-8">
      <div className="animate-pulse">
        <div className="text-purple-300 text-xl font-bold mb-4">Loading Today&apos;s Races...</div>
        <div className="text-purple-400">Fetching race data</div>
      </div>
    </div>
  )
})

export default function UpcomingRacesWrapper() {
  return <UpcomingRaces />
}
