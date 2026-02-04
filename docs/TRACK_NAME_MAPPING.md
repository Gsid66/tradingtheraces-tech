# Track Name Mapping - Surface-Aware System

This document explains the enhanced track name mapping system that handles surface-specific track variations (e.g., Newcastle turf vs Beaumont synthetic).

## Overview

The track name mapping system provides bidirectional conversion between:
- **TTR (Trading The Races)** ratings data track names
- **PuntingForm API** track names

It handles the special case where **the same physical venue has different names based on racing surface**.

## The Newcastle/Beaumont Problem

### Background

Newcastle Racecourse in NSW has two racing surfaces:
- **Turf track**: Called "Newcastle" in TTR data
- **Synthetic track**: Called "Beaumont" in PuntingForm API

Both refer to the same physical venue, but use different names based on the racing surface.

### Impact

Without surface-aware mapping:
- Form guide pages don't show TTR ratings for Beaumont meetings
- Database queries fail to join Newcastle ratings with Beaumont meetings
- Data appears incomplete to users

### Solution

The enhanced mapping system:
1. Knows that Newcastle and Beaumont are the same venue
2. Uses the `surface` field from PuntingForm API to determine the correct name
3. Tries all possible variations when fetching or joining data

## Architecture

### 1. Track Name Mappings (`lib/utils/track-name-mappings.ts`)

Central configuration file containing all track name mappings.

#### Surface-Specific Tracks

```typescript
export const SURFACE_SPECIFIC_TRACKS: Record<string, {
  turfName: string;
  syntheticName: string;
  location: string;
}> = {
  'newcastle': {
    turfName: 'Newcastle',
    syntheticName: 'Beaumont',
    location: 'Newcastle, NSW'
  },
  // Add more as identified
};
```

#### TTR to PuntingForm Mapping

Maps TTR track names to all possible PuntingForm variations:

```typescript
export const TTR_TO_PUNTINGFORM: Record<string, string[]> = {
  'newcastle': ['Newcastle', 'Beaumont'],  // Surface-specific
  'sandown': ['Sandown Hillside', 'Sandown Lakeside'],
  'canterbury': ['Canterbury Park'],
  'flemington': ['Flemington'],
  // ... more tracks
};
```

#### PuntingForm to TTR Mapping (Reverse)

Maps PuntingForm names back to canonical TTR names:

```typescript
export const PUNTINGFORM_TO_TTR: Record<string, string> = {
  'beaumont': 'Newcastle',      // Synthetic -> TTR
  'newcastle': 'Newcastle',     // Turf -> TTR
  'canterbury park': 'Canterbury',
  'flemington': 'Flemington',
  // ... more tracks
};
```

### 2. Track Name Standardizer (`lib/utils/track-name-standardizer.ts`)

Enhanced with surface-aware functions:

#### `convertTTRToPuntingForm(ttrName, surface?)`

Converts TTR track name to PuntingForm name(s).

```typescript
import { convertTTRToPuntingForm } from '@/lib/utils/track-name-standardizer';

// Without surface info - returns all possibilities
convertTTRToPuntingForm('Newcastle')
// Returns: ['Newcastle', 'Beaumont']

// With surface info - prioritizes correct variant
convertTTRToPuntingForm('Newcastle', 'synthetic')
// Returns: ['Beaumont', 'Newcastle']
```

#### `convertPuntingFormToTTR(pfName, surface?)`

Converts PuntingForm track name to TTR name(s).

```typescript
import { convertPuntingFormToTTR } from '@/lib/utils/track-name-standardizer';

convertPuntingFormToTTR('Beaumont')
// Returns: ['Newcastle']

convertPuntingFormToTTR('Canterbury Park')
// Returns: ['Canterbury']
```

#### `getAllPossibleMatches(trackName, surface?)`

Gets all variations for comprehensive matching.

```typescript
import { getAllPossibleMatches } from '@/lib/utils/track-name-standardizer';

getAllPossibleMatches('Newcastle')
// Returns: {
//   ttr: ['Newcastle'],
//   puntingForm: ['Newcastle', 'Beaumont']
// }
```

#### `standardizeTrackNameWithSurface(name, surface?, format?)`

Smart standardization with surface awareness.

```typescript
import { standardizeTrackNameWithSurface } from '@/lib/utils/track-name-standardizer';

// Convert to PuntingForm format with surface
await standardizeTrackNameWithSurface('Newcastle', 'synthetic', 'PuntingForm')
// Returns: 'Beaumont'

// Convert to TTR format
await standardizeTrackNameWithSurface('Beaumont', undefined, 'TTR')
// Returns: 'Newcastle'
```

## Usage Examples

### Form Guide Integration

The form guide tries all possible TTR track name variations:

```typescript
// app/form-guide/[trackSlug]/[raceNumber]/page.tsx

const puntingFormTrackName = meeting.track.name;  // e.g., "Beaumont"
const surface = meeting.track.surface;             // e.g., "synthetic"

// Get all possible TTR names
const possibleTTRNames = convertPuntingFormToTTR(puntingFormTrackName, surface);
// Returns: ['Newcastle']

// Try each variation until we find ratings
let ttrData: any = null;
for (const ttrTrackName of possibleTTRNames) {
  try {
    const ttrResponse = await ttrClient.getRatingsForRace(
      dateStr,
      ttrTrackName,
      raceNum
    );
    
    if (ttrResponse.data && ttrResponse.data.length > 0) {
      ttrData = ttrResponse.data;
      break; // Found it!
    }
  } catch (error) {
    // Try next variation
  }
}
```

### Database Queries

For database queries, the track names should be standardized in the `race_cards_ratings` table using the migration script. The queries then use simple equality:

```sql
LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
  AND rcr.track = m.track_name
```

The standardization migration (from PR #69) should be run with the enhanced mappings to ensure Newcastle/Beaumont are handled correctly.

## Diagnostic Tools

### 1. Track Mismatch Diagnostic Script

Identifies track name mismatches by comparing PuntingForm and TTR data.

```bash
# Run for today
npx tsx scripts/diagnose-track-mismatches.ts

# Run for specific date
npx tsx scripts/diagnose-track-mismatches.ts 2026-02-05
```

**Output:**
```
🔍 Track Name Matching Diagnostic Report
Date: 2026-02-05

✅ Successfully Matched:
   Flemington ↔ Flemington
   Randwick ↔ Randwick
   Beaumont (synthetic) ↔ Newcastle
      ℹ️  Surface-specific track (uses different names by surface)

⚠️ Mismatches - PuntingForm Tracks Without TTR Data:
   PuntingForm: "Some New Track"
      Expected TTR: Some New Track
      Mapping exists: ❌
      💡 Add to PUNTINGFORM_TO_TTR: 'some new track': 'Some New Track'

📈 SUMMARY
Total PuntingForm meetings: 15
Total TTR tracks: 12
Successfully matched: 12
Mismatches: 1
Surface-specific tracks racing today: 1
   - Beaumont (synthetic)
```

### 2. Track Mapping Validation Script

Checks historical database data for mapping issues.

```bash
# Analyze last 30 days
npx tsx scripts/validate-track-mappings.ts

# Analyze last 90 days
npx tsx scripts/validate-track-mappings.ts --days 90

# Show fix suggestions
npx tsx scripts/validate-track-mappings.ts --fix
```

**Output:**
```
🔍 Track Name Mapping Validation

📊 Analyzing track mappings for last 30 days...

Track: Newcastle
  Records: 450
  Matched meetings: 8
  Records with results: 380 (84.4%)
  Has mapping: ✅
  Possible matches: Newcastle, Beaumont

💡 MAPPING SUGGESTIONS
Add these mappings to lib/utils/track-name-mappings.ts:
[suggestions for any missing mappings]

📈 SUMMARY
Total issues found: 0
Missing mappings: 0
Low match rates: 0

✅ All track mappings are valid!
```

## Adding New Track Mappings

### When to Add a Mapping

Add a mapping when:
1. A track has multiple name variations between systems
2. A track has different names based on racing surface
3. The diagnostic script identifies unmapped tracks

### Step-by-Step Process

1. **Run Diagnostic Script**
   ```bash
   npx tsx scripts/diagnose-track-mismatches.ts
   ```

2. **Identify the Issue**
   Look for tracks in the "Mismatches" or "Missing Explicit Mapping" sections.

3. **Update Mappings File**
   
   Edit `lib/utils/track-name-mappings.ts`:

   **For surface-specific tracks:**
   ```typescript
   export const SURFACE_SPECIFIC_TRACKS = {
     // ... existing entries
     'newtrack': {
       turfName: 'New Track',
       syntheticName: 'New Track Synthetic',
       location: 'City, State'
     }
   };
   ```

   **For TTR → PuntingForm:**
   ```typescript
   export const TTR_TO_PUNTINGFORM = {
     // ... existing entries
     'newtrack': ['New Track', 'New Track Synthetic']
   };
   ```

   **For PuntingForm → TTR:**
   ```typescript
   export const PUNTINGFORM_TO_TTR = {
     // ... existing entries
     'new track': 'New Track',
     'new track synthetic': 'New Track'
   };
   ```

4. **Run Database Migration**
   
   Update existing data to use new mappings:
   ```bash
   npx tsx scripts/standardize-track-names.ts
   ```

5. **Verify Changes**
   ```bash
   npx tsx scripts/diagnose-track-mismatches.ts
   npx tsx scripts/validate-track-mappings.ts
   ```

## Surface-Specific Tracks

### Currently Configured

| Physical Venue | Turf Name | Synthetic Name | Location |
|---------------|-----------|----------------|----------|
| Newcastle | Newcastle | Beaumont | Newcastle, NSW |

### Adding More

If you identify other tracks with surface-specific names:

1. Add to `SURFACE_SPECIFIC_TRACKS` in mappings file
2. Add both names to `TTR_TO_PUNTINGFORM` 
3. Add both names to `PUNTINGFORM_TO_TTR` pointing to the same TTR name
4. Run database migration
5. Test with diagnostic script

## Troubleshooting

### Form Guide Not Showing TTR Ratings

**Symptom:** Form guide page loads but TTR ratings don't appear.

**Solution:**
1. Check server logs for track name conversion attempts
2. Verify the track name mapping exists in `track-name-mappings.ts`
3. Run diagnostic script for that date
4. Check if TTR API has data for that track/date

**Debug logging:**
```typescript
// Set in .env.local
TRACK_NAME_DEBUG=true
```

### Database Queries Missing State Information

**Symptom:** Trading desk pages show NULL for state column.

**Solution:**
1. Verify track names are standardized in `race_cards_ratings` table
2. Run the validation script to check match rates
3. Run the standardization migration if needed
4. Check that `pf_meetings` table has the meeting data

### New Track Not Recognized

**Symptom:** Diagnostic script shows unmapped track.

**Solution:**
1. Add the track to all three mapping objects in `track-name-mappings.ts`
2. Run database migration: `npx tsx scripts/standardize-track-names.ts`
3. Verify with diagnostic script

### Surface Information Not Available

**Symptom:** Surface field is null or empty.

**Solution:**
The system falls back to trying all variations when surface is unknown:
- This is expected behavior
- All possible names are tried in order
- The first match that returns data is used

## Testing

### Manual Testing

1. **Test Newcastle/Beaumont:**
   - Wait for a Beaumont meeting (synthetic surface)
   - Navigate to form guide for that meeting
   - Verify TTR ratings appear
   - Check server logs for successful track name conversion

2. **Test Database Queries:**
   - Run race viewer with date filters
   - Check that state information appears for all tracks
   - Verify Newcastle races show state = "NSW"

3. **Test Backward Compatibility:**
   - Check that non-surface-specific tracks still work
   - Verify Flemington, Randwick, etc. show ratings correctly

### Automated Testing

Run diagnostic scripts regularly:

```bash
# Daily check (can be added to CI/CD)
npx tsx scripts/diagnose-track-mismatches.ts

# Weekly validation
npx tsx scripts/validate-track-mappings.ts --days 7
```

## Performance Considerations

### Caching

- Track name mappings are static imports (no runtime overhead)
- PuntingForm API cache is handled by existing standardizer (24 hours)
- Database queries use direct equality (no function calls on join columns)

### Form Guide

- Tries track variations sequentially (not in parallel)
- Stops at first successful match
- Typically 1-2 API calls per race (fast)

### Database Queries

- No change from PR #69 implementation
- Uses indexed columns for joins
- Fast query execution

## Best Practices

1. **Always Use Surface Information When Available**
   ```typescript
   // Good
   convertPuntingFormToTTR(trackName, meeting.track.surface)
   
   // Acceptable (fallback)
   convertPuntingFormToTTR(trackName)
   ```

2. **Log Track Name Conversions in Development**
   ```typescript
   // Set in .env.local
   TRACK_NAME_DEBUG=true
   ```

3. **Run Diagnostic Script Before Deployments**
   ```bash
   npx tsx scripts/diagnose-track-mismatches.ts
   ```

4. **Update Mappings Promptly**
   When diagnostic script identifies new tracks, add them immediately.

5. **Document New Surface-Specific Tracks**
   Update this documentation when adding new surface-specific tracks.

## Future Enhancements

Potential improvements:

1. **Automatic Mapping Learning**
   - Detect patterns in successful matches
   - Suggest new mappings automatically

2. **Admin UI**
   - Web interface for managing mappings
   - Visual track name comparison tool

3. **API Endpoint**
   - Expose track name conversion as REST API
   - Allow external tools to use the mapping

4. **Surface Detection**
   - Auto-detect racing surface from race metadata
   - Improve accuracy of surface-specific conversions

5. **Historical Analysis**
   - Track mapping accuracy over time
   - Alert on declining match rates

## Support

For issues or questions:

1. Check this documentation
2. Run diagnostic scripts to identify the issue
3. Review server logs for error messages
4. Check that environment variables are set correctly
5. Verify database migrations have been run

## Related Documentation

- [Track Name Standardization](./TRACK_NAME_STANDARDIZATION.md) - Original PR #69 implementation
- [API Migration](./API_MIGRATION.md) - API integration guide
- [Trading Desk](./TRADING_DESK.md) - Trading desk features

## Changelog

### 2026-02-05 - Initial Implementation
- Added surface-specific track mappings
- Enhanced standardizer with bidirectional conversion
- Updated form guide to try multiple track variations
- Created diagnostic and validation scripts
- Documented Newcastle/Beaumont example
