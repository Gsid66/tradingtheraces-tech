# API Migration: Homepage to Punting Form API

## Overview
This document describes the migration of the homepage "Upcoming Races" section from the old scraper API to the Punting Form API.

## Problem Statement
The homepage `/api/races/today` endpoint was calling an old scraper API (`racing-data-api.onrender.com`) that:
1. Returned yesterday's data (2026-01-28 instead of 2026-01-29)
2. Was no longer actively maintained
3. Cost money to keep running on Render
4. Created inconsistency since Form Guide already used Punting Form API

## Solution
Replaced the entire `app/api/races/today/route.ts` file with Punting Form API integration.

### Changes Made

#### Before (Old Scraper API)
```typescript
// Called external scraper API
const datesResponse = await fetch(`${apiUrl}/api/dates`, { cache: 'no-store' })
const dates = await datesResponse.json()
const todayData = dates.find((d: any) => d.date === today) || dates[0]
```

#### After (Punting Form API)
```typescript
// Uses Punting Form client library
const pfClient = getPuntingFormClient()
const meetingsResponse = await pfClient.getTodaysMeetings()
const tracks = meetings.map(meeting => ({
  track_name: meeting.track.name,
  track_state: meeting.track.state,
  race_count: meeting.races || 0,
  runner_count: 0,
  meeting_id: meeting.meetingId
}))
```

## Benefits
1. ✅ Always returns TODAY's races (Punting Form is always up-to-date)
2. ✅ Includes state information for timezone conversion
3. ✅ No dependency on old scraper API (can be deleted from Render)
4. ✅ Consistent data source across entire application
5. ✅ Saves hosting costs (~$7-10/month)

## API Response Format

### Endpoint
`GET /api/races/today`

### Success Response (200)
```json
{
  "success": true,
  "date": "2026-01-29",
  "track_count": 15,
  "tracks": [
    {
      "track_name": "Flemington",
      "track_state": "VIC",
      "race_count": 8,
      "runner_count": 0,
      "meeting_id": "123456"
    }
  ]
}
```

### Error Responses

#### No Races Available (404)
```json
{
  "error": "No races available today"
}
```

#### Server Error (500)
```json
{
  "error": "Failed to fetch races",
  "message": "Error details here"
}
```

## Data Compatibility
The new response format maintains backward compatibility with existing homepage components:
- `tracks[]` array with all required fields (`track_name`, `race_count`, `runner_count`)
- `date` string in YYYY-MM-DD format (AEDT timezone)
- Additional fields (`track_state`, `meeting_id`) are bonus data for future enhancements

## Environment Variables

### No Longer Required
- ❌ `RACING_DATA_API_URL` - can be removed after deployment

### Required
- ✅ `PUNTING_FORM_API_KEY` - already configured in production

## Testing
- ✅ Build passes successfully
- ✅ TypeScript compilation passes
- ✅ Linting passes (consistent with existing code style)
- ✅ Code review completed (no issues)
- ✅ CodeQL security scan (no vulnerabilities)

## Deployment Checklist
After this PR is merged:

1. **Verify Production**
   - [ ] Check homepage displays today's races correctly
   - [ ] Verify console logs show "Fetching today's meetings from Punting Form API"
   - [ ] Confirm date is correct (not yesterday's date)

2. **Cleanup Old Infrastructure**
   - [ ] Delete `racing-data-api.onrender.com` service from Render
   - [ ] Remove `RACING_DATA_API_URL` from production environment variables
   - [ ] Update any documentation mentioning the old scraper API

3. **Monitor**
   - [ ] Check error logs for any API failures
   - [ ] Verify homepage loads within acceptable time
   - [ ] Confirm race data accuracy

## Rollback Plan
If issues occur in production:

1. Revert the commit that changed `app/api/races/today/route.ts`
2. Re-add `RACING_DATA_API_URL` environment variable
3. Keep old scraper running on Render temporarily
4. Investigate and fix the issue
5. Re-deploy when ready

## Related Files
- `app/api/races/today/route.ts` - The changed API route
- `app/components/UpcomingRaces.tsx` - Homepage component using this API
- `app/components/RaceCarousel.tsx` - Carousel component using this API
- `lib/integrations/punting-form/client.ts` - Punting Form API client library

## Migration Date
**Completed:** 2026-01-29

## Contact
For questions or issues related to this migration, please contact the development team.
