# Automated Data Sync

## Overview
This project uses GitHub Actions to automatically sync PuntingForm race data and weather forecasts to the database every day.

## What Gets Synced

### 1. PuntingForm Data (runs first)
- **Source**: PuntingForm API
- **Destination**: Database tables
  - `pf_meetings` - Race meetings
  - `pf_races` - Individual races
  - `pf_runners` - Horses/runners
  - `pf_horses`, `pf_jockeys`, `pf_trainers` - Entity data
- **Purpose**: Populates database for analysis and weather integration

### 2. Weather Data (runs second)
- **Source**: MET Norway API
- **Destination**: Weather tables
  - `track_weather` - Forecast cache
  - `track_weather_history` - Historical observations
  - `race_weather_conditions` - Race-time conditions
- **Purpose**: Display weather on site, enable analysis

### 3. Scratchings (runs third)
- **Source**: PuntingForm API
- **Destination**: `pf_scratchings` table
- **Purpose**: Track withdrawn horses

## Schedule

| Time (AEDT) | Cron (UTC) | Purpose |
|-------------|------------|---------|
| **5:00 AM** | `0 18 * * *` | Morning data load - meetings appear |
| **8:00 AM** | `0 21 * * *` | Pre-race update - final changes |
| **Every 30 mins (9 AM - 9 PM)** | `*/30 22-10 * * *` | Live updates during races |

## How to Manually Trigger

1. Go to: https://github.com/Gsid66/tradingtheraces-tech/actions
2. Click: **"Sync PuntingForm and Weather Data"**
3. Click: **"Run workflow"** button (top right)
4. Select branch: **main**
5. Click: Green **"Run workflow"** button
6. Watch the live logs as it runs

## Required GitHub Secrets

Go to: **Settings → Secrets and variables → Actions**

Add these secrets (if not already present):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DATABASE_URL` | Render PostgreSQL connection URL | `postgres://user:pass@host.render.com/db` |
| `PUNTING_FORM_API_KEY` | PuntingForm API key | `97ccffbc-c97b-46e0-8231-...` |
| `WEATHER_USER_AGENT` | MET Norway user agent | `TradingTheRaces/1.0 (site.com; email@example.com)` |

### Adding a Secret

1. Click **"New repository secret"**
2. Enter **Name** (exactly as shown above)
3. Enter **Secret** value
4. Click **"Add secret"**

## Viewing Logs

1. Go to: **GitHub → Actions** tab
2. Click on any workflow run
3. Expand each step to see detailed logs
4. Look for ✅ success or ❌ error messages

## Troubleshooting

### ❌ Sync fails at "Sync PuntingForm Data"
- Check `DATABASE_URL` is correct in GitHub secrets
- Check `PUNTING_FORM_API_KEY` is valid
- Verify Render database is accessible
- Check PuntingForm API status

### ❌ Sync fails at "Sync Weather Data"
- Ensure PuntingForm sync succeeded first
- Check `WEATHER_USER_AGENT` is set in GitHub secrets
- Verify meetings exist in database
- Check MET Norway API status

### ⚠️ No data appears on site
- Check workflow completed successfully (green checkmark)
- Verify database tables have data (use DBeaver)
- Check site cache/CDN

### 🐌 Workflow doesn't trigger on schedule
- GitHub Actions can have 10-15 minute delays
- Check workflow file syntax is correct
- Try manual trigger to test

## Modifying the Schedule

Edit: `.github/workflows/sync-data.yml`

```yaml
on:
  schedule:
    - cron: '0 18 * * *'  # Change time here (UTC)
```

**Cron format:** `minute hour day month dayOfWeek`

**Important:** GitHub Actions uses UTC time!
- AEDT = UTC+11 (summer)
- AEST = UTC+10 (winter)

**Examples:**
- 5 AM AEDT = 6 PM UTC (18:00) = `0 18 * * *`
- 8 AM AEDT = 9 PM UTC (21:00) = `0 21 * * *`
- Every 30 mins = `*/30 * * * *`

## Data Flow

```
GitHub Actions (scheduled)
    ↓
1. Sync PuntingForm data
    ↓
   Database (pf_meetings, pf_races, etc.)
    ↓
2. Sync Weather data
    ↓
   Database (track_weather, etc.)
    ↓
3. Sync Scratchings
    ↓
   Database (pf_scratchings)
    ↓
Website displays fresh data ✨
```

## Why This Matters

**Without automation:**
- ❌ Database stays empty
- ❌ Weather features don't work
- ❌ No historical analysis possible
- ❌ Manual sync required daily

**With automation:**
- ✅ Database populated every morning
- ✅ Weather displays on site
- ✅ Historical data accumulates
- ✅ Zero manual maintenance
