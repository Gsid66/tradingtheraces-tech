# Scratchings API Integration - Implementation Summary

## Overview
This implementation integrates the existing scratchings API (`/api/scratchings`) throughout the TTR website to display scratched horses across relevant pages.

## What Was Implemented

### 1. Core Infrastructure

#### Custom Hook: `lib/hooks/useScratchings.ts`
- Fetches scratchings data from the API
- Auto-refreshes every 2 minutes to stay current
- Handles loading and error states
- Supports jurisdiction filtering (AU, NZ, or both)

#### Utility Functions: `lib/utils/scratchings.ts`
- `isHorseScratched()` - Check if a horse is scratched
- `getScratchingDetails()` - Get full scratching details for a horse
- `filterScratched()` - Filter out scratched horses from a list
- `countScratchingsForRace()` - Count scratchings for a specific race

#### Global Context Provider: `app/providers/ScratchingsProvider.tsx`
- Provides scratchings data throughout the app via React Context
- Eliminates need for multiple API calls
- Automatically refreshes data every 2 minutes
- Exports `useScratchingsContext()` hook for consuming components

#### Visual Components
- `app/components/ScratchingsBadge.tsx` - Badge component for scratched horses
- `app/components/ScratchingsSummary.tsx` - Summary component showing all scratchings

### 2. Layout Integration

#### Root Layout: `app/layout.tsx`
- Wrapped entire app with `ScratchingsProvider`
- Makes scratchings data available to all client components

### 3. Component Integration

#### UpcomingRaces Component: `app/components/UpcomingRaces.tsx`
- Shows scratching count badge on race cards
- Displays as "X SCR" in red badge next to race number
- Uses `countScratchingsForRace()` utility

### 4. Existing Integrations (Already Working)

#### Form Guide Page: `app/form-guide/[trackSlug]/[raceNumber]/page.tsx`
- Already fetches and displays scratchings from server-side
- Uses existing `components/racing/ScratchingsBadge.tsx` component
- Shows scratched horses with visual indicators and reasons

#### Trading Desk: `app/trading-desk/[date]/page.tsx`
- Already filters out scratched horses from analysis
- Uses existing `lib/utils/scratchings-matcher.ts` utilities
- Shows scratched count in statistics

#### Results Page: `app/results/page.tsx`
- Displays historical results
- No scratchings integration needed (scratched horses wouldn't have results)

## Key Features

### Auto-Refresh
- Scratchings data refreshes every 2 minutes
- Ensures users always see current scratching information
- Configurable interval in `useScratchings.ts`

### Case-Insensitive Matching
- All horse and track name comparisons are case-insensitive
- Handles name variations gracefully

### Error Handling
- Gracefully degrades if API is unavailable
- Doesn't break the UI if scratchings can't be loaded
- Error states are tracked but don't prevent page rendering

### Performance
- Single API call for all scratchings (via context provider)
- Data shared across all components
- No redundant API requests

## API Endpoint

**Endpoint:** `/api/scratchings`
**Query Parameters:** `jurisdiction` (0=AU, 1=NZ, 2=Both)
**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "meetingId": "string",
      "raceId": "string",
      "raceNumber": 1,
      "trackName": "string",
      "horseName": "string",
      "tabNumber": 1,
      "scratchingTime": "ISO8601 timestamp",
      "reason": "string (optional)"
    }
  ]
}
```

## Testing

### Manual Testing Checklist
- [x] TypeScript compiles without errors
- [ ] Scratchings data loads from API
- [ ] UpcomingRaces shows scratching counts
- [ ] Form guide displays scratched horses correctly
- [ ] Trading desk excludes scratched horses
- [ ] Auto-refresh updates scratchings every 2 minutes
- [ ] Error handling works when API fails

### Known Limitations
1. Jurisdiction is currently hardcoded to 0 (Australia only) in the provider
2. No loading indicator shown while initial scratchings data fetches
3. Build requires network access to Google Fonts (deployment consideration)

## Future Enhancements
1. Add jurisdiction selector to switch between AU/NZ
2. Add loading skeleton for initial scratchings load
3. Add scratchings summary on home page using `ScratchingsSummary` component
4. Add notifications when new scratchings are detected
5. Cache scratchings data with localStorage for offline support

## Files Changed
- `lib/hooks/useScratchings.ts` (new)
- `lib/utils/scratchings.ts` (new)
- `app/providers/ScratchingsProvider.tsx` (new)
- `app/components/ScratchingsBadge.tsx` (new)
- `app/components/ScratchingsSummary.tsx` (new)
- `app/layout.tsx` (modified)
- `app/components/UpcomingRaces.tsx` (modified)

## Total Changes
- 6 new files created
- 2 files modified
- ~250 lines of code added
