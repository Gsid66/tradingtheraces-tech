# Automated Data Sync

## Overview
This project uses GitHub Actions to automatically sync race data and weather information to the database every day. The automated workflow ensures that the database is populated each morning before users access the site, enabling weather features and historical analysis.

## Workflows

### Primary Workflow: sync-data.yml
The main workflow (`.github/workflows/sync-data.yml`) syncs all core data in the correct order:
1. PuntingForm data (meetings, races, runners) - MUST run first
2. Weather data - depends on meetings being in database
3. Scratchings - optional, non-critical

### Individual Workflows (for specific needs)
Separate workflows exist for granular control:
- `sync-main-data.yml` - PuntingForm data only
- `sync-weather.yml` - Weather data only
- `sync-scratchings.yml` - Scratchings only (runs every 15 minutes)
- `sync-results.yml` - Race results (different schedule)

**Recommendation**: Use the comprehensive `sync-data.yml` workflow for normal operations. Individual workflows are available for testing or specific use cases.

## What Gets Synced

### 1. PuntingForm Data (meetings, races, runners)
- **Source**: PuntingForm API
- **Database tables**: `pf_meetings`, `pf_races`, `pf_runners`, `pf_horses`, `pf_jockeys`, `pf_trainers`
- **Purpose**: Core racing data required for all site features
- **Note**: This MUST run first as weather sync depends on meetings existing in the database

### 2. Weather Data (temperature, wind, conditions)
- **Source**: MET Norway API
- **Database tables**: `track_weather`, `track_weather_history`, `race_weather_conditions`
- **Purpose**: Display weather conditions on form guide pages
- **Note**: Requires meetings to exist in `pf_meetings` table first

### 3. Scratchings (withdrawn horses)
- **Source**: PuntingForm API
- **Database tables**: `pf_scratchings`
- **Purpose**: Track late scratchings and withdrawals
- **Note**: Optional - failures are non-critical

## Schedule

The automated sync runs at these times (Australian Eastern time):

| Time (AEDT) | Cron (UTC) | Purpose |
|-------------|------------|---------|
| **5:00 AM** | `0 18 * * *` | Morning data load - get today's meetings |
| **8:00 AM** | `0 21 * * *` | Pre-race update - final changes before racing |
| **9 AM - 9 PM (every 30 min)** | `*/30 22-10 * * *` | Live race day updates during racing hours |

**Important**: GitHub Actions uses UTC time. The cron expressions above are converted from AEDT (UTC+11).

## Workflow Execution Order

The sync runs in this specific order:

1. **PuntingForm Data Sync** (FIRST)
   - Fetches today's meetings, races, and runners
   - Stores in database tables
   - MUST complete successfully for weather sync to work

2. **Weather Data Sync** (SECOND)
   - Queries `pf_meetings` for track locations
   - Fetches weather forecasts from MET Norway
   - Stores weather conditions in database

3. **Scratchings Sync** (THIRD)
   - Updates scratched horses
   - Non-critical - will not fail the workflow

## How to Manually Trigger

You can manually trigger the sync for testing or to force an update:

1. Go to GitHub → **Actions** tab
2. Click **"Sync PuntingForm and Weather Data"** workflow
3. Click **"Run workflow"** button (top right)
4. Select branch: **`main`**
5. Click green **"Run workflow"** button

The workflow will start immediately and you can view live logs.

## Required GitHub Secrets

The workflow requires these secrets to be configured in GitHub:

**Go to**: Repository → Settings → Secrets and variables → Actions

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string from Render | `postgresql://user:pass@host/db` |
| `PUNTING_FORM_API_KEY` | API key for PuntingForm API | Your API key from PuntingForm |
| `WEATHER_USER_AGENT` | User agent for MET Norway API | `TradingTheRaces/1.0 (yoursite.com; email@example.com)` |

### How to Add/Update Secrets

1. Go to Repository → **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret** (or edit existing)
4. Enter the secret name and value
5. Click **Add secret**

## Viewing Logs

To view logs of a workflow run:

1. Go to GitHub → **Actions** tab
2. Click on any workflow run (shows date/time)
3. Click on the job: **"Sync Racing and Weather Data"**
4. Expand each step to see detailed logs:
   - **Sync PuntingForm Data** - Shows meetings, races, runners synced
   - **Sync Weather Data** - Shows weather fetched for each track
   - **Sync Scratchings** - Shows scratchings processed
5. Look for error messages if sync fails (marked with ❌)

### Understanding Logs

**Successful sync** shows:
```
📊 Syncing PuntingForm data to database...
✅ Found 12 meetings
✅ PuntingForm sync complete

🌤️  Syncing weather data...
✅ Found 12 meetings for today
✅ Weather sync complete

🎉 All data synced successfully!
```

**Failed sync** shows:
```
❌ Sync failed! Check the logs above.
Common issues:
  - Database connection failed
  - API rate limits
  - Missing secrets
```

## Troubleshooting

### Sync fails at "Sync PuntingForm Data"

**Symptoms**: First step fails, no subsequent steps run

**Possible causes**:
- Database connection issue - check `DATABASE_URL` secret
- Invalid API key - verify `PUNTING_FORM_API_KEY` is correct
- Network issue accessing PuntingForm API
- Database timeout or unavailable

**Solution**:
1. Verify `DATABASE_URL` secret is correct
2. Test database connectivity manually
3. Verify `PUNTING_FORM_API_KEY` is valid and not expired
4. Check Render database status

### Sync fails at "Sync Weather Data"

**Symptoms**: PuntingForm sync succeeds, weather sync fails

**Possible causes**:
- No meetings in database (PuntingForm sync didn't add meetings)
- Missing `WEATHER_USER_AGENT` secret
- Invalid User-Agent format
- MET Norway API rate limit or downtime

**Solution**:
1. Verify PuntingForm sync completed successfully
2. Check database has records in `pf_meetings` table
3. Verify `WEATHER_USER_AGENT` secret exists
4. Ensure User-Agent format: `AppName/Version (site.com; email@example.com)`

### Sync fails at "Sync Scratchings"

**Symptoms**: Warning shown but workflow continues

**Note**: Scratchings sync is optional and non-critical. The workflow will continue even if this step fails.

**If you want to fix it**:
- Verify `PUNTING_FORM_API_KEY` is valid
- Check scratchings API endpoint is available

### No data appears on site

**Symptoms**: Workflow succeeds but site shows no data

**Possible causes**:
- Site is fetching from wrong source (API instead of database)
- Database queries are incorrect
- Wrong environment configuration

**Solution**:
1. Verify workflow completed successfully in GitHub Actions
2. Check database tables have data:
   ```sql
   SELECT COUNT(*) FROM pf_meetings WHERE meeting_date = CURRENT_DATE;
   SELECT COUNT(*) FROM track_weather;
   ```
3. Verify site is configured to fetch from database
4. Check application environment variables

### Workflow doesn't run on schedule

**Symptoms**: Manual trigger works but scheduled runs don't happen

**Possible causes**:
- Repository is in a fork (scheduled workflows disabled)
- GitHub Actions disabled for repository
- Branch is not default branch

**Solution**:
1. Ensure Actions are enabled: Settings → Actions → General
2. Verify workflow is on the default branch (`main`)
3. Check GitHub status page for service issues

## Modifying the Schedule

To change when the sync runs, edit `.github/workflows/sync-data.yml`:

```yaml
on:
  schedule:
    - cron: '0 18 * * *'  # Change time here
```

### Cron Expression Format

Format: `minute hour day month dayOfWeek`

Examples:
- `0 18 * * *` - Daily at 18:00 UTC (5:00 AM AEDT)
- `*/30 22-10 * * *` - Every 30 minutes between 22:00-10:00 UTC
- `0 */2 * * *` - Every 2 hours
- `0 9-17 * * 1-5` - Hourly, 9am-5pm, Monday-Friday

**Remember**: GitHub Actions uses UTC time, not local time!

### Time Zone Conversion

Australian Eastern Time zones:
- **AEDT** (UTC+11): October - April (Daylight Saving)
- **AEST** (UTC+10): April - October (Standard Time)

To convert AEDT to UTC:
- 5:00 AM AEDT = 18:00 previous day UTC (6:00 PM previous day)
- 8:00 AM AEDT = 21:00 previous day UTC (9:00 PM previous day)
- 12:00 PM AEDT = 01:00 same day UTC (1:00 AM same day)

## Architecture

### Why This Order Matters

```
┌─────────────────────────────────┐
│   1. PuntingForm Data Sync      │
│   ┌─────────────────────────┐   │
│   │ Fetch meetings/races    │   │
│   │ Store in pf_meetings    │   │
│   │ Store in pf_races       │   │
│   │ Store in pf_runners     │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   2. Weather Data Sync          │
│   ┌─────────────────────────┐   │
│   │ Query pf_meetings       │   │ ← Depends on step 1
│   │ Get track coordinates   │   │
│   │ Fetch weather from API  │   │
│   │ Store in track_weather  │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   3. Scratchings Sync           │
│   ┌─────────────────────────┐   │
│   │ Fetch scratchings       │   │
│   │ Update pf_scratchings   │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Critical dependency**: Weather sync reads from `pf_meetings` table, so PuntingForm sync must complete first.

## Benefits of Automation

### Before Automation
- ❌ Database remained empty
- ❌ Weather features didn't work
- ❌ Historical analysis impossible
- ❌ Manual intervention required daily
- ❌ Data could be stale or missing

### With Automation
- ✅ Database populated every morning automatically
- ✅ Weather displays on site
- ✅ Historical data accumulates over time
- ✅ Zero manual maintenance required
- ✅ Data always fresh and up-to-date
- ✅ Consistent sync timing for reliability

## Rate Limits and Best Practices

### API Rate Limits

- **PuntingForm API**: Check your plan's rate limits
- **MET Norway API**: Generally permissive, but use appropriate User-Agent

### Best Practices

1. **Don't run too frequently**: Current schedule (every 30 mins) is reasonable
2. **Respect API limits**: Avoid adding more frequent syncs
3. **Monitor failures**: Check logs regularly for issues
4. **Update secrets**: Rotate API keys periodically
5. **Test manually**: Use workflow_dispatch to test changes

## Monitoring and Maintenance

### Regular Checks

- **Weekly**: Review workflow runs for any failures
- **Monthly**: Verify data quality in database
- **Quarterly**: Review and update documentation

### Metrics to Monitor

- Workflow success rate
- Sync duration (should be consistent)
- Number of meetings/races synced
- Database growth over time

### When to Investigate

- Multiple consecutive failures
- Significantly longer sync times
- Reduced data volume
- Missing data on site

## Support and Resources

### Related Documentation

- [Weather Integration](./WEATHER_INTEGRATION.md) - Weather feature details
- [API Integration](./API_INTEGRATION.md) - API usage guide
- [Deployment](./DEPLOYMENT.md) - Deployment and configuration

### Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review workflow logs in GitHub Actions
3. Verify all secrets are configured correctly
4. Test database connectivity
5. Check API status pages

### Useful Commands

**Test database connection**:
```bash
npx tsx scripts/test-db-connection.ts
```

**Manual sync** (local testing):
```bash
npx tsx scripts/sync-pf-data.ts
npx tsx scripts/sync-weather-data.ts
npx tsx scripts/sync-scratchings.ts
```

**Check database data**:
```sql
-- Check today's meetings
SELECT * FROM pf_meetings WHERE meeting_date = CURRENT_DATE;

-- Check weather data
SELECT * FROM track_weather WHERE last_updated > NOW() - INTERVAL '1 day';

-- Check scratchings
SELECT * FROM pf_scratchings ORDER BY scratched_at DESC LIMIT 10;
```
