# Track Conditions System Documentation

## Overview

The track conditions system provides automated fetching, storage, and display of real-time track conditions from the Punting Form API. The system stores conditions in the database with historical tracking and provides both API access and a dashboard interface.

## Architecture

### Components

1. **Database Table**: `pf_track_conditions` - Stores track conditions with history
2. **Sync Script**: `scripts/sync-conditions.ts` - Manual and scheduled sync
3. **API Endpoints**:
   - `/api/conditions` - Fetch conditions from Punting Form API
   - `/api/conditions/db` - Fetch conditions from database
   - `/api/cron/sync-conditions` - Scheduled sync endpoint
4. **UI Components**:
   - `TrackConditionBadge` - Display track condition with colors
   - `/conditions` page - Dashboard view of all conditions
5. **Integration**: Form guide pages can fetch from database

## Database Schema

```sql
CREATE TABLE pf_track_conditions (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(100) NOT NULL,
  track_name VARCHAR(200) NOT NULL,
  track_condition VARCHAR(100) NOT NULL,
  rail_position VARCHAR(200),
  weather VARCHAR(200),
  penetrometer VARCHAR(100),
  jurisdiction INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_meeting FOREIGN KEY (meeting_id) 
    REFERENCES pf_meetings(meeting_id) ON DELETE CASCADE
);
```

### Indexes

- `idx_track_conditions_meeting` - Query by meeting_id
- `idx_track_conditions_track` - Query by track_name
- `idx_track_conditions_updated` - Query by update time
- `idx_track_conditions_jurisdiction` - Query by jurisdiction

### Jurisdictions

- `0` - Australia (AU)
- `1` - New Zealand (NZ)
- `2` - International

## Setup

### 1. Run Database Migration

```bash
psql $DATABASE_URL -f migrations/010_create_track_conditions_table.sql
```

Or use the migrate script:

```bash
npm run migrate
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
DATABASE_URL=postgresql://username:password@host:port/database
PUNTING_FORM_API_KEY=your-api-key-here
CRON_SECRET=your-secure-random-secret
```

### 3. Initial Sync

Run manual sync to populate the database:

```bash
npm run sync:conditions
```

## Usage

### Manual Sync

Run the sync script manually:

```bash
npm run sync:conditions
```

This will:
- Fetch conditions for AU, NZ, and International jurisdictions
- Update existing records or create new ones
- Log detailed progress and summary

### Watch Mode

For development, watch for changes and re-run:

```bash
npm run sync:conditions:watch
```

### Scheduled Sync

Set up a cron job on your hosting platform to hit the sync endpoint every 15 minutes:

```bash
*/15 * * * * curl -X GET https://your-domain.com/api/cron/sync-conditions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Platform-Specific Examples

**Linux/Unix Cron:**
```bash
# Edit crontab
crontab -e

# Add line (runs every 15 minutes)
*/15 * * * * curl -X GET https://your-domain.com/api/cron/sync-conditions -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/conditions-sync.log 2>&1
```

**Render.com:**
Use Render's Cron Jobs feature to create a job that hits the endpoint.

**Railway.app:**
Use Railway's Cron Jobs or external services like cron-job.org.

**External Cron Services:**
- [cron-job.org](https://cron-job.org) - Free cron service
- [EasyCron](https://www.easycron.com) - Paid service with more features

## API Usage

### Fetch from Database

```typescript
const response = await fetch('/api/conditions/db');
const data = await response.json();

// data.conditions will be an array of:
interface TrackCondition {
  id: number;
  meeting_id: string;
  track_name: string;
  track_condition: string;
  rail_position: string | null;
  weather: string | null;
  jurisdiction: number;
  updated_at: string;
  created_at: string;
}
```

### Fetch from Punting Form API

```typescript
const response = await fetch('/api/conditions?jurisdiction=0');
const data = await response.json();
// data.data will contain live API results
```

### Trigger Manual Sync

```typescript
const response = await fetch('/api/cron/sync-conditions', {
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
});
const result = await response.json();
```

## Querying Conditions

### Get All Conditions

```sql
SELECT * FROM pf_track_conditions
ORDER BY track_name;
```

### Get Conditions by Jurisdiction

```sql
SELECT * FROM pf_track_conditions
WHERE jurisdiction = 0  -- Australia
ORDER BY track_name;
```

### Get Conditions for Specific Track

```sql
SELECT * FROM pf_track_conditions
WHERE track_name = 'Flemington'
ORDER BY updated_at DESC
LIMIT 1;
```

### Get Conditions for Meeting

```sql
SELECT * FROM pf_track_conditions
WHERE meeting_id = 'R123456'
LIMIT 1;
```

### Get Recent Updates

```sql
SELECT * FROM pf_track_conditions
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

## UI Components

### TrackConditionBadge

Display track conditions with visual indicators:

```tsx
import TrackConditionBadge from '@/components/racing/TrackConditionBadge';

<TrackConditionBadge
  condition="Good 4"
  railPosition="True"
  weather="Fine"
  updatedAt={condition.updated_at}
  showTimestamp={true}
/>
```

#### Color Coding

- **Green** - Fast/Firm (1-2)
- **Blue** - Good (3-4)
- **Orange** - Soft (5-7)
- **Red** - Heavy (8-10)
- **Purple** - Synthetic

### Conditions Dashboard

Access the dashboard at `/conditions` to view:
- All current track conditions
- Filter by jurisdiction (AU, NZ, International)
- Auto-refresh every 30 seconds
- Manual refresh button
- Last update timestamps

## Integration with Form Guide

To integrate track conditions in your form guide pages:

```typescript
// In your form guide page component
const [trackCondition, setTrackCondition] = useState(null);

useEffect(() => {
  async function fetchCondition() {
    const response = await fetch('/api/conditions/db');
    const data = await response.json();
    
    // Find condition for this meeting
    const condition = data.conditions.find(
      c => c.meeting_id === meetingId
    );
    setTrackCondition(condition);
  }
  
  fetchCondition();
}, [meetingId]);

// Display
{trackCondition && (
  <div className="mb-4">
    <h3 className="font-bold mb-2">Track Conditions</h3>
    <TrackConditionBadge
      condition={trackCondition.track_condition}
      railPosition={trackCondition.rail_position}
      weather={trackCondition.weather}
      updatedAt={trackCondition.updated_at}
      showTimestamp={true}
    />
  </div>
)}
```

## Troubleshooting

### Sync Script Fails

**Error: "Cannot connect to database"**
- Check DATABASE_URL is correctly set
- Verify database is accessible
- Check SSL settings if required

**Error: "PUNTING_FORM_API_KEY is not set"**
- Ensure API key is in .env.local
- Restart application after adding env var

**Error: "relation pf_track_conditions does not exist"**
- Run the migration: `psql $DATABASE_URL -f migrations/010_create_track_conditions_table.sql`

**Error: "foreign key constraint"**
- The meeting_id must exist in pf_meetings table first
- Ensure meetings are synced before conditions

### API Endpoint Issues

**401 Unauthorized on cron endpoint:**
- Check CRON_SECRET matches in both .env.local and cron job
- Verify Authorization header format: `Bearer YOUR_SECRET`

**500 Error on /api/conditions/db:**
- Check database connection
- Verify table exists and has data
- Check server logs for detailed error

### UI Issues

**Dashboard shows "No conditions available":**
- Run sync script to populate data
- Check /api/conditions/db returns data
- Check browser console for errors

**Auto-refresh not working:**
- Check browser console for errors
- Verify /api/conditions/db endpoint works
- Check network tab for failed requests

### Data Issues

**Conditions not updating:**
- Check cron job is running
- Verify last successful sync time
- Run manual sync to test
- Check Punting Form API is accessible

**Missing track conditions:**
- Some tracks may not have conditions reported
- Check jurisdiction is correct (0=AU, 1=NZ, 2=International)
- Verify meeting exists in pf_meetings table

## Monitoring

### Check Last Sync Time

```sql
SELECT 
  track_name,
  track_condition,
  updated_at,
  NOW() - updated_at AS age
FROM pf_track_conditions
ORDER BY updated_at DESC
LIMIT 10;
```

### Check Sync Statistics

```sql
SELECT 
  jurisdiction,
  COUNT(*) as total_conditions,
  MAX(updated_at) as last_update,
  MIN(updated_at) as oldest_update
FROM pf_track_conditions
GROUP BY jurisdiction;
```

### View Sync Logs

Check your application logs or cron job logs for sync output:

```bash
# If using systemd
journalctl -u your-app-name -f | grep "sync"

# If logging to file
tail -f /var/log/conditions-sync.log
```

## Best Practices

1. **Sync Frequency**: Every 15 minutes is recommended for live racing
2. **Error Handling**: The sync continues even if one jurisdiction fails
3. **Database Cleanup**: Consider archiving old conditions (>7 days)
4. **Monitoring**: Set up alerts if sync fails multiple times
5. **API Rate Limits**: Be aware of Punting Form API rate limits
6. **Caching**: UI auto-refreshes every 30 seconds to balance freshness and load

## Performance Considerations

- Indexes optimize queries by meeting_id, track_name, and updated_at
- Cascade delete removes conditions when meetings are deleted
- Parameterized queries prevent SQL injection
- Database connection pooling recommended for high traffic
- Consider caching frequently accessed conditions

## Future Enhancements

Potential improvements to consider:

1. **Historical Analysis**: Track condition changes over time
2. **Alerts**: Notify when conditions change significantly
3. **Weather Integration**: Correlate with weather data
4. **Predictions**: Predict condition changes based on weather
5. **Mobile App**: Push notifications for condition changes
6. **Export**: CSV/JSON export of historical data
7. **Analytics**: Performance analysis by track condition
