# Sandown Track Name Migration

## Problem Statement

The database had inconsistent track naming that caused JOIN failures:
- `pf_meetings` table: **"Sandown-Hillside"** (with hyphen)
- `race_cards_ratings` table: **"Sandown Hillside"** (with space)

This mismatch caused:
- ❌ Race Viewer showing no results for Sandown Hillside
- ❌ Value Plays showing `-` for ACTUAL SP and RESULT columns
- ❌ Trading Desk statistics excluding Sandown data
- ❌ All pages dependent on `pf_meetings` JOIN failing for Sandown

## Solution

This migration updates the database to use consistent naming (space-separated format) and prevents future occurrences through code changes.

## Running the Migration

### Prerequisites

1. Ensure you have a `.env.local` file with `DATABASE_URL` set:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. Install dependencies if not already installed:
   ```bash
   npm install
   ```

### Execute the Migration

```bash
npx tsx scripts/fix-sandown-track-names.ts
```

### Expected Output

```
🔄 Starting Sandown track name fix...

✅ Connected to database

📍 Updating pf_meetings table...
✅ Updated 15 meeting records:
   - Meeting 12345 on 2026-02-04
   - Meeting 12346 on 2026-01-28
   ...

📍 Checking for Sandown Lakeside variants...
ℹ️  No meetings with "Sandown-Lakeside" found

📍 Checking race_cards_ratings table...
ℹ️  No ratings records needed updating

📊 Summary:
   Meetings fixed: 15
   Ratings fixed: 0

✨ Migration completed successfully!
```

## Verification Steps

### 1. Check Track Names in Database

```sql
SELECT DISTINCT track_name 
FROM pf_meetings 
WHERE track_name ILIKE '%sandown%'
ORDER BY track_name;
```

**Expected Result:**
```
track_name
-----------------
Sandown Hillside
Sandown Lakeside
```

(No hyphens should appear)

### 2. Test the JOIN

```sql
SELECT 
  rcr.track,
  m.track_name,
  ra.race_id,
  rcr.race_number
FROM race_cards_ratings rcr
LEFT JOIN pf_meetings m 
  ON rcr.race_date = m.meeting_date 
  AND rcr.track = m.track_name
LEFT JOIN pf_races ra 
  ON ra.meeting_id = m.meeting_id 
  AND rcr.race_number = ra.race_number
WHERE rcr.race_date = '2026-02-04'
  AND rcr.track ILIKE '%sandown%'
LIMIT 5;
```

**Expected Result:**
- All columns should have values (no NULLs)
- `race_id` column should show actual IDs, not NULL
- `track` and `track_name` should match

### 3. Check Race Viewer

1. Navigate to the Race Viewer page
2. Select date: Feb 4, 2026
3. Find Sandown Hillside races
4. Verify:
   - ✅ ACTUAL SP column shows odds (not `-`)
   - ✅ RESULT column shows finishing positions (not `-`)
   - ✅ State column shows "VIC"
   - ✅ All data is populated correctly

## What Changed

### Database Changes
- All `pf_meetings.track_name` values changed from "Sandown-Hillside" to "Sandown Hillside"
- All `pf_meetings.track_name` values changed from "Sandown-Lakeside" to "Sandown Lakeside" (if any existed)
- Any inconsistent `race_cards_ratings.track` values normalized

### Code Changes
1. **Track Name Mappings** (`lib/utils/track-name-mappings.ts`)
   - Added hyphenated variations to mappings
   - Ensures both formats are recognized

2. **Track Name Standardizer** (`lib/utils/track-name-standardizer.ts`)
   - Enhanced `normalizeForComparison()` to replace hyphens with spaces
   - Automatic normalization during matching

3. **Sync Script** (`scripts/sync-pf-data.ts`)
   - Normalizes hyphens to spaces during data import
   - Prevents future hyphenated names from entering the database

## Safety Features

- ✅ **Transaction-based**: Uses BEGIN/COMMIT/ROLLBACK
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Logging**: Shows exactly what was changed
- ✅ **Non-destructive**: Only updates track names, no data loss

## Rollback (if needed)

If you need to rollback the changes:

```sql
BEGIN;

UPDATE pf_meetings 
SET track_name = 'Sandown-Hillside'
WHERE track_name = 'Sandown Hillside';

UPDATE pf_meetings 
SET track_name = 'Sandown-Lakeside'
WHERE track_name = 'Sandown Lakeside';

COMMIT;
```

**Note:** Rollback is NOT recommended as it will break the JOINs again. Only rollback if there's a critical issue.

## Troubleshooting

### "Connection timeout" error
- Check that `DATABASE_URL` is correct in `.env.local`
- Verify database is accessible from your network
- Check firewall settings

### "No meetings found" message
- This is normal if there are no hyphenated track names in the database
- The migration is idempotent and safe to run anyway

### Changes don't appear in UI
1. Restart your Next.js development server
2. Clear browser cache
3. Verify database changes were committed
4. Check server logs for any errors

## Future Prevention

The code changes ensure this issue won't happen again:

1. **Automatic Normalization**: The `normalizeForComparison()` function now replaces hyphens with spaces
2. **Import Prevention**: `sync-pf-data.ts` normalizes all track names during import
3. **Mapping Coverage**: Both hyphenated and space-separated formats are in the mappings

## Support

If you encounter any issues:

1. Check the migration script output for error messages
2. Verify database connection settings
3. Review server logs for any errors
4. Run the verification SQL queries above
5. Check that `.env.local` has the correct `DATABASE_URL`

## Related Documentation

- [Track Name Mapping Documentation](../docs/TRACK_NAME_MAPPING.md)
- [Track Name Standardization](../docs/TRACK_NAME_STANDARDIZATION.md)
