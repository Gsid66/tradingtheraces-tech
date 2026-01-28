'use client'

import { useState, useEffect } from 'react'
import { FaChevronLeft, FaChevronRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import { convertTo24Hour } from '@/lib/utils/timezone-converter'

interface Runner {
  tab_number: number
  horse_name: string
  barrier?:  number
  jockey_name?:  string
  trainer_name?: string
  weight?: number
  form?: string
  age_sex?: string
  ttr_rating?: number
  tab_fixed_win?: number
  tab_fixed_place?: number
  career_wins?: number
  career_places?:  number
  career_starts?: number
}

interface Race {
  race_number: number
  race_name: string
  race_type?:  string
  race_time?: string
  distance?: number
  prize_money?: number
  runner_count:  number
  runners:  Runner[]
  track_name:  string
}

interface Track {
  track_name: string
  race_count: number
  runner_count: number
}

export default function RaceCarousel() {
  const [allRaces, setAllRaces] = useState<Race[]>([])
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState('')

  // Fetch and merge all races on mount
  useEffect(() => {
    fetchAllRaces()
    const interval = setInterval(fetchAllRaces, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchAllRaces = async () => {
    try {
      setLoading(true)
      
      // Step 1: Get today's tracks
      const tracksResponse = await fetch('/api/races/today')
      
      if (!tracksResponse.ok) {
        const errorData = await tracksResponse.json().catch(() => ({}))
        console.error('❌ API Error:', tracksResponse.status, errorData)
        
        // If it's a 404 or 500, likely no races available
        if (tracksResponse. status === 404 || tracksResponse. status === 500) {
          setError('No races currently available. Check back later for tomorrow\'s races!')
          setLoading(false)
          return
        }
        
        throw new Error('Failed to fetch tracks')
      }
      
      const tracksData = await tracksResponse. json()
      const tracks: Track[] = tracksData.tracks || []
      
      // Check if we got any tracks
      if (tracks. length === 0) {
        setError('No races currently available. Check back later for tomorrow\'s races!')
        setLoading(false)
        return
      }
      
      const date = tracksData.date
      setCurrentDate(date)
      
      console.log(`📅 Fetching races for ${tracks.length} tracks on ${date}`)
      
      // Step 2: Fetch form guide for each track
      const allRacesPromises = tracks.map(async (track) => {
  try {
    const response = await fetch(
      `/api/races/form-guide?date=${date}&track=${encodeURIComponent(track.track_name)}`
    )
    if (!response.ok) {
      console.error(`❌ Failed to fetch ${track. track_name}:  ${response.status}`)
      // Log the error but continue with other tracks
      return []
    }
          
          const data = await response.json()
          const races: Race[] = data.races || []
          
          // Add track_name to each race
          return races.map(race => ({
            ...race,
            track_name: track.track_name
          }))
        } catch (err) {
          console.error(`Error fetching ${track.track_name}:`, err)
          return []
        }
      })
      
      // Step 3: Wait for all requests to complete
      const racesArrays = await Promise.all(allRacesPromises)
      const flattenedRaces = racesArrays.flat()
      
      // Step 4: Sort by race_time (chronological order) - using 24-hour format
      const sortedRaces = flattenedRaces.sort((a, b) => {
        const timeA = convertTo24Hour(a.race_time || '99:99')
        const timeB = convertTo24Hour(b.race_time || '99:99')
        return timeA.localeCompare(timeB)
      })
      
      setAllRaces(sortedRaces)
      
      // Step 5: Find the next race based on current time
      const nextRaceIndex = findNextRace(sortedRaces)
      setCurrentRaceIndex(nextRaceIndex)
      
      console.log(`✅ Loaded ${sortedRaces.length} total races across all tracks`)
      setError(null)
      
    } catch (err) {
      console.error('Error fetching all races:', err)
      setError('Unable to load race data')
    } finally {
      setLoading(false)
    }
  }

  const findNextRace = (races: Race[]) => {
    if (! races || races.length === 0) return 0
    
    // Get current time in AEDT (24-hour format HH:MM)
    const now = new Date()
    const currentTimeStr = now.toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: '2-digit',
      minute:  '2-digit',
      hour12: false
    })
    
    console.log('🕐 Current time (AEDT):', currentTimeStr)
    console.log('🏇 Total races loaded:', races.length)
    
    // Find the first race that hasn't started yet
    for (let i = 0; i < races.length; i++) {
      const race = races[i]
      if (race.race_time) {
        // Convert race time to 24-hour format for comparison
        const raceTime24 = convertTo24Hour(race.race_time)
        
        // Log first few for debugging
        if (i < 3) {
          console.log(`  Race ${i + 1}:  ${race.track_name} R${race.race_number} at ${race.race_time} (${raceTime24})`)
        }
        
        // Compare times as strings (works for HH:MM format)
        if (raceTime24 > currentTimeStr) {
          console.log(`✅ Next race: ${race.track_name} Race ${race.race_number} at ${race.race_time}`)
          return i
        }
      }
    }
    
    // If all races have passed, show the last race
    console.log('⏰ All races finished, showing last race')
    return races.length - 1
  }

  const goToPreviousRace = () => {
    if (currentRaceIndex > 0) {
      setCurrentRaceIndex(currentRaceIndex - 1)
    }
  }

  const goToNextRace = () => {
    if (currentRaceIndex < allRaces.length - 1) {
      setCurrentRaceIndex(currentRaceIndex + 1)
    }
  }

  // Loading state
  if (loading && allRaces.length === 0) {
    return (
      <div className="race-carousel-container">
        <div className="race-carousel-loading">
          <div className="spinner"></div>
          <p>Loading today's races...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="race-carousel-container">
        <div className="race-carousel-error">
          <p>{error}</p>
          <button onClick={fetchAllRaces} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (allRaces.length === 0) {
    return (
      <div className="race-carousel-container">
        <div className="race-carousel-empty">
          <p>No races available at this time</p>
        </div>
      </div>
    )
  }

  const currentRace = allRaces[currentRaceIndex]

  return (
    <div className="race-carousel-container">
      {/* Race Header */}
      <div className="race-carousel-header">
        <div className="race-carousel-track-info">
          <FaMapMarkerAlt className="track-icon" />
          <h2>{currentRace.track_name}</h2>
          <span className="race-number">Race {currentRace.race_number}</span>
        </div>
        <div className="race-carousel-meta">
          {currentRace.race_time && (
            <span className="race-time">
              <FaClock /> {currentRace.race_time}
            </span>
          )}
          {currentRace.distance && (
            <span className="race-distance">{currentRace.distance}m</span>
          )}
        </div>
      </div>

      {/* Race Name */}
<div className="race-carousel-race-name">
  <h3>{currentRace.race_name}</h3>
</div>

      {/* Navigation Arrows */}
      <div className="race-carousel-navigation">
        <button
          onClick={goToPreviousRace}
          disabled={currentRaceIndex === 0}
          className="race-nav-button race-nav-prev"
          aria-label="Previous race"
        >
          <FaChevronLeft />
          <span>Previous</span>
        </button>

        <button
          onClick={goToNextRace}
          disabled={currentRaceIndex === allRaces.length - 1}
          className="race-nav-button race-nav-next"
          aria-label="Next race"
        >
          <span>Next</span>
          <FaChevronRight />
        </button>
      </div>

      {/* Runners Table */}
      <div className="race-carousel-runners">
        <table className="runners-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Horse</th>
              <th>Jockey</th>
              <th>Trainer</th>
              <th>Barrier</th>
              <th>Weight</th>
              <th>Form</th>
              <th>TTR</th>
              <th>Win</th>
              <th>Place</th>
            </tr>
          </thead>
          <tbody>
            {currentRace.runners.map((runner) => (
              <tr key={runner.tab_number}>
                <td className="runner-number">{runner. tab_number}</td>
                <td className="runner-horse">
                  <strong>{runner.horse_name}</strong>
                  {runner.age_sex && (
                    <span className="horse-age-sex">{runner.age_sex}</span>
                  )}
                </td>
                <td className="runner-jockey">{runner.jockey_name || '-'}</td>
                <td className="runner-trainer">{runner.trainer_name || '-'}</td>
                <td className="runner-barrier">{runner.barrier || '-'}</td>
                <td className="runner-weight">{runner.weight || '-'}</td>
                <td className="runner-form">{runner.form || '-'}</td>
                <td className="runner-ttr">
                  {runner.ttr_rating ?  (
                    <span className="ttr-badge">{runner.ttr_rating}</span>
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </td>
                <td className="runner-odds-win">
                  {runner. tab_fixed_win ? (
                    <span className="odds-value">${runner.tab_fixed_win. toFixed(2)}</span>
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </td>
                <td className="runner-odds-place">
                  {runner.tab_fixed_place ? (
                    <span className="odds-value">${runner.tab_fixed_place.toFixed(2)}</span>
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Race Progress Indicator */}
      <div className="race-carousel-progress">
        <span>
          Race {currentRaceIndex + 1} of {allRaces.length} total races today
        </span>
      </div>
    </div>
  )
}