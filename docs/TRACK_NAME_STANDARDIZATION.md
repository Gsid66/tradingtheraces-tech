# Track Name Standardization

This document explains the track name standardization system implemented to ensure consistency between TTR ratings data and PuntingForm API data.

## Problem

Track names in the `race_cards_ratings` table didn't consistently match the track names from PuntingForm API, causing:
- Failed database joins between ratings and race data
- Missing TTR ratings on form guide pages
- Missing state information on trading desk pages
- Performance overhead from `LOWER()` and `TRIM()` functions in queries

## Solution

A comprehensive track name standardization system that:
1. Fetches canonical track names from PuntingForm API
2. Maps common variations to canonical names
3. Updates all existing data to use standardized names
4. Ensures new data uses standardized names from upload

## Components

### 1. Track Name Standardizer Service

**Location:** `lib/utils/track-name-standardizer.ts`

The standardizer service provides:

#### `standardizeTrackName(trackName, options?)`

Converts any track name to its canonical PuntingForm equivalent.

```typescript
import { standardizeTrackName } from '@/lib/utils/track-name-standardizer';

// Basic usage
const canonical = await standardizeTrackName('Canterbury');
// Returns: "Canterbury Park"

// With options
const canonical = await standardizeTrackName('Sandown', {
  forceRefresh: true,  // Force refresh of cache
  throwOnMissing: true  // Throw error if no match found
});
```

#### `validateTrackName(trackName)`

Validates if a track name exists in PuntingForm's current meetings.

```typescript
import { validateTrackName } from '@/lib/utils/track-name-standardizer';

const result = await validateTrackName('Canterbury');
// Returns: { valid: true, canonical: "Canterbury Park" }

const result2 = await validateTrackName('Unknown Track');
// Returns: { valid: false, suggestion?: string }
```

#### `getAllCanonicalTrackNames()`

Gets all known canonical track names.

```typescript
import { getAllCanonicalTrackNames } from '@/lib/utils/track-name-standardizer';

const tracks = await getAllCanonicalTrackNames();
// Returns: ["Canterbury Park", "Flemington", "Randwick", ...]
```

### 2. Database Migration Script

**Location:** `scripts/standardize-track-names.ts`

One-time migration script that updates all existing records.

#### Running the Migration

```bash
# Set environment variables
export DATABASE_URL="your-database-url"
export PUNTING_FORM_API_KEY="your-api-key"

# Run migration
npx tsx scripts/standardize-track-names.ts
```

#### What it Does

1. Fetches all distinct track names from `race_cards_ratings`
2. Maps each to its canonical PuntingForm name
3. Shows preview of changes
4. Asks for confirmation (skipped in CI)
5. Updates all records in a transaction
6. Logs statistics

#### Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏇 TRACK NAME STANDARDIZATION MIGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Building transformation map...

  ✓ "Canterbury" -> "Canterbury Park" (1,234 records)
  ✓ "Sandown" -> "Sandown Hillside" (890 records)
  ○ "Flemington" (already standardized, 2,456 records)

📊 MIGRATION STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total track names:        45
Tracks changed:           12
Tracks unchanged:         33
Total records:            47,892
Records updated:          8,234

✅ Migration completed successfully!
```

### 3. Updated Database Queries

All database queries joining `race_cards_ratings` with `pf_meetings` now use direct equality instead of `LOWER(TRIM())`:

**Before:**
```sql
LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
  AND LOWER(TRIM(rcr.track)) = LOWER(TRIM(m.track_name))
```

**After:**
```sql
LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
  AND rcr.track = m.track_name
```

**Files Updated:**
- `app/race-viewer/page.tsx`
- `app/trading-desk/[date]/page.tsx`
- `app/trading-desk/statistics/page.tsx`
- `app/trading-desk/threshold-analyzer/page.tsx`
- `app/trading-desk/place-performance/page.tsx`
- `app/api/trading-desk/ai-race-analysis/route.ts`

### 4. Form Guide Integration

**Location:** `app/form-guide/[trackSlug]/[raceNumber]/page.tsx`

The form guide now standardizes track names before querying ratings:

```typescript
const standardizedTrackName = await standardizeTrackName(meeting.track.name);

const ttrResponse = await ttrClient.getRatingsForRace(
  dateStr,
  standardizedTrackName,  // Use standardized name
  raceNum
);
```

## Common Track Name Variations

The system handles these common variations:

| Input | Canonical Output |
|-------|-----------------|
| Canterbury | Canterbury Park |
| Sandown | Sandown Hillside |
| Rosehill | Rosehill Gardens |
| Flemington | Flemington |
| Randwick | Randwick |
| Caulfield | Caulfield |
| Moonee Valley | Moonee Valley |
| Doomben | Doomben |
| Eagle Farm | Eagle Farm |
| Morphettville | Morphettville |

## How It Works

### Normalization Algorithm

1. **Lowercase & Trim:** Convert to lowercase and trim whitespace
2. **Remove Suffixes:** Remove common suffixes (Racecourse, Gardens, Hillside, Park, Racing)
3. **Clean Special Chars:** Remove special characters, normalize spaces
4. **Match Against API:** Compare with current PuntingForm track names
5. **Fuzzy Match:** Use contains logic for partial matches (min 5 chars)
6. **Fallback:** Return original if no match found

### Caching

- Track name mappings are cached for 24 hours
- Cache is rebuilt when expired or on force refresh
- Cache includes mappings from last 3 days of meetings (yesterday, today, tomorrow)

### Safety Features

- **Transactional:** Migration uses database transactions (rollback on error)
- **Logging:** All transformations are logged
- **Confirmation:** Interactive confirmation before updates (skipped in CI)
- **Idempotent:** Can be run multiple times safely
- **Graceful Fallback:** Returns original name if standardization fails

## Usage Examples

### In API Routes

```typescript
import { standardizeTrackName } from '@/lib/utils/track-name-standardizer';

export async function POST(request: Request) {
  const { trackName, date, raceNumber } = await request.json();
  
  // Standardize before querying database
  const standardizedTrack = await standardizeTrackName(trackName);
  
  const ratings = await fetchRatings(date, standardizedTrack, raceNumber);
  return Response.json(ratings);
}
```

### In Server Components

```typescript
import { standardizeTrackName } from '@/lib/utils/track-name-standardizer';

export default async function RacePage({ params }) {
  const meeting = await fetchMeeting(params.meetingId);
  
  // Standardize before querying
  const standardizedTrack = await standardizeTrackName(meeting.track.name);
  
  const ratings = await getRatings(standardizedTrack);
  // ...
}
```

### During Data Upload

```typescript
import { standardizeTrackName } from '@/lib/utils/track-name-standardizer';

async function uploadRatings(data: RatingData[]) {
  // Standardize track names before inserting
  const standardizedData = await Promise.all(
    data.map(async (row) => ({
      ...row,
      track: await standardizeTrackName(row.track),
    }))
  );
  
  await database.insert(standardizedData);
}
```

## Troubleshooting

### Track Name Not Found

If a track name can't be standardized:

1. **Check PuntingForm API:** Ensure the track has meetings in the past/next 24 hours
2. **Add to COMMON_VARIATIONS:** Add the variation to the mapping in `track-name-standardizer.ts`
3. **Force Refresh Cache:** Use `forceRefresh: true` option
4. **Manual Override:** Use the exact PuntingForm track name

Example:
```typescript
// If "Warwick Farm" isn't being standardized correctly
const COMMON_VARIATIONS = {
  // ... existing entries
  'warwick farm': 'Warwick Farm',
  'warwick': 'Warwick Farm',
};
```

### State Information Missing

If state information is missing from trading desk queries:

1. **Run Migration:** Ensure migration script has been run
2. **Check Join:** Verify track names match exactly between tables
3. **Check pf_meetings:** Ensure PuntingForm data is synced

```sql
-- Check for mismatches
SELECT DISTINCT rcr.track, m.track_name, m.state
FROM race_cards_ratings rcr
LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
  AND rcr.track = m.track_name
WHERE m.state IS NULL
LIMIT 10;
```

### Ratings Not Appearing on Form Guide

If TTR ratings aren't showing on form guide:

1. **Check Logs:** Look for standardization logs in server output
2. **Verify Track Name:** Ensure standardized name matches database
3. **Check Race Date:** Verify date format matches
4. **Check Race Number:** Ensure race number is correct

```typescript
// Enable detailed logging
console.log('🔍 Fetching TTR data:', {
  originalTrackName: meeting.track.name,
  standardizedTrackName,
  date: dateStr,
  raceNumber: raceNum
});
```

## Performance Benefits

### Before Standardization
```sql
-- Slow query with LOWER/TRIM
AND LOWER(TRIM(rcr.track)) = LOWER(TRIM(m.track_name))
```

### After Standardization
```sql
-- Fast query with direct equality
AND rcr.track = m.track_name
```

**Benefits:**
- ✅ Faster query execution (no function calls on join columns)
- ✅ Can use indexes effectively
- ✅ Simpler query plans
- ✅ Consistent results

## Testing

### Verify Migration

```bash
# Run migration in test mode
npx tsx scripts/standardize-track-names.ts

# Check results
psql $DATABASE_URL -c "SELECT DISTINCT track FROM race_cards_ratings ORDER BY track;"
```

### Test Form Guide

1. Navigate to form guide: `/form-guide`
2. Select a meeting
3. Check browser console for standardization logs
4. Verify TTR ratings appear correctly

### Test Trading Desk

1. Navigate to trading desk: `/trading-desk/[date]`
2. Verify state information appears for all tracks
3. Check that value calculations include state data

## Maintenance

### Daily Tasks
- None required (cache auto-refreshes)

### Weekly Tasks
- Monitor logs for failed standardizations
- Add new track variations as needed

### Monthly Tasks
- Review and update `COMMON_VARIATIONS` mapping
- Verify all active tracks are recognized

## Future Enhancements

Potential improvements:

1. **Admin UI:** Web interface to manage track name mappings
2. **Auto-Learning:** Automatically learn new variations from data
3. **API Endpoint:** Expose standardization as an API for external use
4. **Metrics:** Track standardization success rate
5. **Alerts:** Notify when unknown track names are encountered

## Support

For issues or questions:
1. Check this documentation
2. Review server logs for error messages
3. Run migration script with verbose logging
4. Contact development team with specific track name examples
