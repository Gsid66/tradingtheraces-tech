# API Integration Guide

## Overview

This document describes the integration of external APIs and services used in the Trading The Races application.

## Punting Form API

The Punting Form API provides comprehensive horse racing data including meetings, races, runners, results, scratchings, and track conditions.

### Base URL
```
https://api.puntingform.com.au/v2
```

### Authentication
All API requests require an API key passed as a query parameter:
```
?apiKey={your-api-key}
```

Set your API key in `.env.local`:
```env
PUNTING_FORM_API_KEY=your-api-key-here
```

### Available Endpoints

#### 1. Meetings List
```typescript
GET /form/meetingslist?meetingDate={dd-MMM-yyyy}&stage=(A)&apiKey={key}
```
Returns all meetings for a specific date.

**Usage:**
```typescript
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';

const pfClient = getPuntingFormClient();
const meetingsResponse = await pfClient.getTodaysMeetings();
const meetings = meetingsResponse.payLoad || [];
```

#### 2. Race Fields
```typescript
GET /form/fields?meetingId={meetingId}&apiKey={key}
```
Returns all races and runners for a specific meeting.

**Usage:**
```typescript
const racesResponse = await pfClient.getAllRacesForMeeting(meetingId);
const races = racesResponse.payLoad?.races || [];
```

#### 3. Results
```typescript
GET /form/results?raceId={raceId}&apiKey={key}
GET /form/results?meetingId={meetingId}&apiKey={key}
GET /form/results?meetingDate={dd-MMM-yyyy}&apiKey={key}
```
Returns race results.

**Usage:**
```typescript
const resultsResponse = await pfClient.getRaceResults(raceId);
const results = resultsResponse.payLoad || [];
```

#### 4. Scratchings
```typescript
GET /Updates/Scratchings?jurisdiction={0|1|2}&apiKey={key}
```
Returns current scratchings for a jurisdiction.

**Query Parameters:**
- `jurisdiction` (int32): 0 = AU, 1 = NZ, 2 = International (default: 0)

**Response Interface:**
```typescript
interface PFScratching {
  meetingId: string;
  raceId: string;
  raceNumber: number;
  trackName: string;
  horseName: string;
  tabNumber: number;
  scratchingTime: string;
  reason?: string;
}
```

**Usage:**
```typescript
const scratchingsResponse = await pfClient.getScratchings(0); // AU only
const scratchings = scratchingsResponse.payLoad || [];
```

#### 5. Track Conditions
```typescript
GET /Updates/Conditions?jurisdiction={0|1|2}&apiKey={key}
```
Returns current track conditions for a jurisdiction.

**Query Parameters:**
- `jurisdiction` (int32): 0 = AU, 1 = NZ, 2 = International (default: 0)

**Response Interface:**
```typescript
interface PFCondition {
  meetingId: string;
  trackName: string;
  trackCondition: string; // e.g., "Good 4", "Heavy 8", "Synthetic"
  railPosition?: string;
  weather?: string;
  updatedAt: string;
}
```

**Usage:**
```typescript
const conditionsResponse = await pfClient.getConditions(0); // AU only
const conditions = conditionsResponse.payLoad || [];
```

### API Routes

The application provides internal API routes that wrap Punting Form endpoints:

#### Scratchings API
```
GET /api/scratchings?jurisdiction={0|1|2}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "meetingId": "...",
      "raceNumber": 3,
      "horseName": "Example Horse",
      "scratchingTime": "2024-01-15T10:30:00",
      "reason": "Vet advice"
    }
  ]
}
```

#### Conditions API
```
GET /api/conditions?jurisdiction={0|1|2}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "meetingId": "...",
      "trackName": "Flemington",
      "trackCondition": "Good 4",
      "railPosition": "True",
      "weather": "Fine",
      "updatedAt": "2024-01-15T09:00:00"
    }
  ]
}
```

## Utility Functions

### Scratching Matcher

Helper functions for matching scratchings with runners:

```typescript
import { isHorseScratched, getScratchingInfo, getScratchingsForRace } from '@/lib/utils/scratchings-matcher';

// Check if a horse is scratched
const isScratched = isHorseScratched(
  scratchings,
  meetingId,
  raceNumber,
  horseName
);

// Get scratching details
const scratchingInfo = getScratchingInfo(
  scratchings,
  meetingId,
  raceNumber,
  horseName
);

// Get all scratchings for a race
const raceScratchings = getScratchingsForRace(
  scratchings,
  meetingId,
  raceNumber
);
```

### Horse Name Matcher

Fuzzy matching for horse names (handles variations in spelling, punctuation):

```typescript
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';

const match = horseNamesMatch("O'Really", "O Really"); // true
```

## React Components

### ScratchingsBadge

Displays a scratching indicator for a horse:

```typescript
import ScratchingsBadge from '@/components/racing/ScratchingsBadge';

<ScratchingsBadge 
  isScratched={true}
  scratchingReason="Vet advice"
/>
```

### TrackConditionBadge

Displays track condition information with color coding:

```typescript
import TrackConditionBadge from '@/components/racing/TrackConditionBadge';

<TrackConditionBadge 
  condition="Good 4"
  railPosition="True"
  weather="Fine"
/>
```

**Color Coding:**
- Heavy: Blue (bg-blue-600)
- Soft: Light Blue (bg-blue-400)
- Good: Green (bg-green-500)
- Firm: Yellow (bg-yellow-500)
- Synthetic: Purple (bg-purple-500)

### ScratchingsFilter

Filter toggle for showing/hiding scratched horses:

```typescript
import ScratchingsFilter from '@/components/racing/ScratchingsFilter';

const [showScratched, setShowScratched] = useState(true);

<ScratchingsFilter 
  scratchedCount={5}
  onToggle={setShowScratched}
/>
```

## Integration Patterns

### Server-Side Page Integration

For server components, fetch scratchings and conditions alongside other data:

```typescript
export default async function RacePage() {
  const pfClient = getPuntingFormClient();
  
  // Fetch scratchings and conditions
  const [scratchingsRes, conditionsRes] = await Promise.all([
    pfClient.getScratchings(0),
    pfClient.getConditions(0)
  ]);
  
  const scratchings = scratchingsRes.payLoad || [];
  const conditions = conditionsRes.payLoad || [];
  
  // Match with runners
  const enrichedRunners = runners.map(runner => ({
    ...runner,
    isScratched: isHorseScratched(
      scratchings,
      meetingId,
      raceNumber,
      runner.horseName
    ),
    scratchingReason: getScratchingInfo(
      scratchings,
      meetingId,
      raceNumber,
      runner.horseName
    )?.reason
  }));
  
  // Get track condition
  const trackCondition = conditions.find(c => c.meetingId === meetingId);
  
  return (
    <div>
      {trackCondition && (
        <TrackConditionBadge 
          condition={trackCondition.trackCondition}
          railPosition={trackCondition.railPosition}
          weather={trackCondition.weather}
        />
      )}
      
      {enrichedRunners.map(runner => (
        <div key={runner.formId}>
          <h3>{runner.horseName}</h3>
          <ScratchingsBadge 
            isScratched={runner.isScratched}
            scratchingReason={runner.scratchingReason}
          />
        </div>
      ))}
    </div>
  );
}
```

### Excluding Scratched Horses from Value Calculations

Important for Trading Desk and other analytical pages:

```typescript
// Filter out scratched horses
const dataWithoutScratched = data.filter(d => {
  const isScratched = scratchings.some(s => 
    horseNamesMatch(s.horseName, d.horse_name) &&
    s.raceNumber === d.race_number
  );
  return !isScratched;
});

// Calculate value scores only for non-scratched horses
const valuePlays = dataWithoutScratched
  .map(d => ({
    ...d,
    valueScore: calculateValueScore(d.rating, d.price)
  }))
  .filter(d => d.valueScore > 25)
  .sort((a, b) => b.valueScore - a.valueScore);
```

## Error Handling

Always handle API failures gracefully:

```typescript
let scratchings: any[] = [];
let conditions: any[] = [];

try {
  const [scratchingsRes, conditionsRes] = await Promise.all([
    pfClient.getScratchings(0),
    pfClient.getConditions(0)
  ]);
  scratchings = scratchingsRes.payLoad || [];
  conditions = conditionsRes.payLoad || [];
} catch (error: any) {
  console.warn('⚠️ Scratchings/conditions unavailable:', error.message);
  // Continue without scratching/condition data
}
```

## Testing

Test the integration using the provided test script:

```bash
npx tsx scripts/test-scratchings-conditions.ts
```

Expected output:
```
🧪 Testing Scratchings and Conditions API

📋 Fetching scratchings...
✅ Found 15 scratchings

Sample scratching:
{
  "meetingId": "...",
  "raceNumber": 3,
  "horseName": "Example Horse",
  ...
}

🌤️  Fetching track conditions...
✅ Found 8 track conditions

Sample condition:
{
  "meetingId": "...",
  "trackName": "Flemington",
  "trackCondition": "Good 4",
  ...
}

✨ Test completed!
```

## Best Practices

1. **Always default to jurisdiction 0 (AU)** unless specifically targeting NZ or International races
2. **Use fuzzy name matching** via `horseNamesMatch()` when comparing horse names from different sources
3. **Handle API failures gracefully** - the app should function without scratchings/conditions data
4. **Cache scratchings/conditions data** appropriately (consider revalidation strategy)
5. **Exclude scratched horses** from value calculations and betting analysis
6. **Display track conditions prominently** on race pages for user context
7. **Use consistent color coding** for track conditions across all pages

## Pages Integrated

- ✅ Form Guide (`app/form-guide/[trackSlug]/[raceNumber]/page.tsx`)
- ✅ Ratings vs Odds Comparison (`app/ratings-odds-comparison/page.tsx`)
- ✅ Trading Desk (`app/trading-desk/[date]/page.tsx`)
- ✅ Race Data (`app/race-data/[date]/page.tsx`)
- ⏳ Race Viewer (lower priority - historical data)
- ⏳ Homepage/Upcoming Races (client components - can be enhanced later)

## Support

For API issues or questions about integration, refer to:
- Punting Form API documentation
- Internal API routes at `/api/scratchings` and `/api/conditions`
- Test script: `scripts/test-scratchings-conditions.ts`
