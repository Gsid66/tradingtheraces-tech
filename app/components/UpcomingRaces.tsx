'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaClock, FaMapMarkerAlt, FaRoad } from 'react-icons/fa'
import { convertTo24Hour } from '@/lib/utils/timezone-converter'

interface Runner {
  tab_number: number
  horse_name: string
  barrier?: number
  jockey_name?: string
  trainer_name?: string
  weight?: number
  form?: string
  age_sex?: string
  ttr_rating?: number
  tab_fixed_win?: number
  tab_fixed_place?: number
  career_wins?: number
  career_places?: number
  career_starts?: number
}

interface Race {
  race_number: number
  race_name: string
  race_type?: string
  race_time?: string
  track_state?: string  // Add track state for timezone reference
  distance?: number
  prize_money?: number
  runner_count: number
  runners: Runner[]
  track_name: string
}

interface Track {
  track_name: string
  track_state?: string  // Add track state for timezone info
  race_count: number
  runner_count: number
}

// Helper function to format time in AEDT (e.g., "2:15 PM")
const formatTimeAEDT = (time24h: string): string => {
  if (!time24h) return ''
  
  const [hours, minutes] = time24h.split(':')
  let hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  
  return `${hour}:${minutes} ${ampm}`
}

// Helper function to create track slug
const createTrackSlug = (trackName: string): string => {
  return trackName.toLowerCase().replace(/\s+/g, '-')
}

// Delay between API requests to avoid rate limiting (in milliseconds)
const RATE_LIMIT_DELAY_MS = 300

export default function UpcomingRaces() {
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)

  // Fetch all races and filter for upcoming
  const fetchUpcomingRaces = async (abortSignal?: AbortSignal) => {
    // Prevent concurrent fetches
    if (isFetching) return
    
    setIsFetching(true)
    try {
      // Step 1: Get today's tracks
      const tracksResponse = await fetch('/api/races/today', {
        signal: abortSignal
      })
      
      if (!tracksResponse.ok) {
        if (tracksResponse.status === 404) {
          setError('No races scheduled for today. Check back later!')
        } else if (tracksResponse.status === 500) {
          setError('Unable to load races. Please try again.')
        } else {
          setError('Failed to load race data')
        }
        setLoading(false)
        setIsFetching(false)
        return
      }
      
      const tracksData = await tracksResponse.json()
      const tracks: Track[] = tracksData.tracks || []
      
      if (tracks.length === 0) {
        setError('No races scheduled for today. Check back later!')
        setLoading(false)
        setIsFetching(false)
        return
      }
      
      const date = tracksData.date
      
      // Step 2: Fetch form guide for each track SEQUENTIALLY with delays to avoid rate limiting
      const allRaces: Race[] = []

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        
        try {
          // Add delay between requests (except for first one) to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS))
          }
          
          console.log(`🏇 Fetching ${track.track_name} (${i + 1}/${tracks.length})`)
          
          const response = await fetch(
            `/api/races/form-guide?date=${date}&track=${encodeURIComponent(track.track_name)}`,
            { signal: abortSignal }
          )
          
          if (!response.ok) {
            console.warn(`⚠️ Failed to fetch ${track.track_name}: ${response.status}`)
            continue
          }
          
          const data = await response.json()
          const races: Race[] = data.races || []
          const trackState = data.track_state || track.track_state  // Get state from API or fallback to tracks list
          
          // Race times from API are now correctly converted to AEDT format
          const racesWithTrack = races.map(race => ({
            ...race,
            race_time: race.race_time,  // Now in AEDT format after API conversion
            track_name: track.track_name,
            track_state: trackState
          }))
          
          allRaces.push(...racesWithTrack)
          
        } catch (err) {
          console.error(`❌ Error fetching ${track.track_name}:`, err)
        }
      }

      // Step 3: Process fetched races
      const flattenedRaces = allRaces
      
      // Step 4: Get current time in AEDT (24-hour format HH:MM) AND current date
      const now = new Date()
      const currentTimeStr = now.toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      const currentDate = now.toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split('/').reverse().join('-') // Convert to YYYY-MM-DD
      
      // Step 5: Filter races that haven't started yet
      // Note: This assumes all races are on the same date (today)
      // For races past midnight, they would be on tomorrow's data
      console.log(`⏰ Current AEDT time: ${currentTimeStr}`)
      console.log(`📅 Checking ${flattenedRaces.length} total races`)
      const upcomingRacesFiltered = flattenedRaces.filter(race => {
        if (!race.race_time) return false
        const raceTime24 = convertTo24Hour(race.race_time)
        const isUpcoming = raceTime24 > currentTimeStr
        console.log(`${isUpcoming ? '✅' : '❌'} ${race.track_name} R${race.race_number}: ${race.race_time} (${raceTime24}) ${isUpcoming ? '>' : '≤'} ${currentTimeStr}`)
        
        // Compare only if we're looking at today's races
        // If the fetched date matches current date, filter by time
        if (date === currentDate) {
          return raceTime24 > currentTimeStr
        }
        
        // If date is in the future, include all races
        return date >= currentDate
      })
      
      console.log(`📊 Result: ${upcomingRacesFiltered.length} upcoming races`)
      
      // Step 6: Sort by race_time (chronological order)
      const sortedRaces = upcomingRacesFiltered.sort((a, b) => {
        const timeA = convertTo24Hour(a.race_time || '99:99')
        const timeB = convertTo24Hour(b.race_time || '99:99')
        return timeA.localeCompare(timeB)
      })
      
      // Step 7: Get next 4 races
      const next4Races = sortedRaces.slice(0, 4)
      
      setUpcomingRaces(next4Races)
      setError(null)
      
    } catch (err: any) {
      // Don't set error if the fetch was aborted (component unmounting)
      if (err.name !== 'AbortError') {
        console.error('Error fetching upcoming races:', err)
        setError('Unable to load race data. Please try again.')
      }
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }

  // Fetch on mount and set up auto-refresh every 30 seconds
  useEffect(() => {
    const abortController = new AbortController()
    
    fetchUpcomingRaces(abortController.signal)
    const interval = setInterval(() => {
      fetchUpcomingRaces(abortController.signal)
    }, 30000) // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval)
      abortController.abort() // Cancel pending requests on unmount
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state with skeleton cards
  if (loading) {
    return (
      <div className="upcoming-races-container" aria-busy="true" aria-live="polite">
        <h2 className="upcoming-races-title">Upcoming Races</h2>
        <p className="sr-only">Loading upcoming races...</p>
        <div className="upcoming-races-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="upcoming-race-card upcoming-race-card-skeleton" aria-hidden="true">
              <div className="skeleton-line skeleton-line-short"></div>
              <div className="skeleton-line skeleton-line-medium"></div>
              <div className="skeleton-line skeleton-line-long"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="upcoming-races-container">
        <h2 className="upcoming-races-title">Upcoming Races</h2>
        <div className="upcoming-races-empty">
          <p>{error}</p>
          <button onClick={() => fetchUpcomingRaces()} className="retry-button">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  // All races complete state
  if (upcomingRaces.length === 0) {
    return (
      <div className="upcoming-races-container" aria-live="polite">
        <h2 className="upcoming-races-title">Upcoming Races</h2>
        <div className="upcoming-races-complete-container">
          <div className="upcoming-races-complete-card">
            <div className="upcoming-races-complete-icon" role="img" aria-label="Moon icon">🌙</div>
            <h3 className="upcoming-races-complete-heading">
              All Races Complete
            </h3>
            <p className="upcoming-races-complete-text">
              No more races today
            </p>
            <p className="upcoming-races-complete-subtext">
              Check back tomorrow!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="upcoming-races-container">
      <h2 className="upcoming-races-title">Upcoming Races</h2>
      <div className="upcoming-races-grid">
        {upcomingRaces.map((race) => {
          const trackSlug = createTrackSlug(race.track_name)
          const formGuideUrl = `/form-guide/${trackSlug}/${race.race_number}`
          const raceTime24 = convertTo24Hour(race.race_time || '')
          const raceTimeFormatted = formatTimeAEDT(raceTime24)
          const ariaLabel = `View Race ${race.race_number} at ${race.track_name} - ${raceTimeFormatted} AEDT`
          
          return (
            <Link 
              key={`${race.track_name}-${race.race_number}`}
              href={formGuideUrl}
              className="upcoming-race-card"
              aria-label={ariaLabel}
            >
              <div className="upcoming-race-card-header">
                <div className="upcoming-race-track">
                  <FaMapMarkerAlt className="upcoming-race-icon" />
                  <span className="upcoming-race-track-name">{race.track_name}</span>
                </div>
                <span className="upcoming-race-number">R{race.race_number}</span>
              </div>
              
              <h3 className="upcoming-race-name">{race.race_name}</h3>
              
              <div className="upcoming-race-details">
                <div className="upcoming-race-detail">
                  <FaClock className="upcoming-race-icon" />
                  <span>{raceTimeFormatted} AEDT</span>
                </div>
                {race.distance && (
                  <div className="upcoming-race-detail">
                    <FaRoad className="upcoming-race-icon" />
                    <span>{race.distance}m</span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
