# UK & Ireland Racing Data Integration

This module provides comprehensive UK & Ireland racing data management capabilities integrated into the tradingtheraces-tech project. It enables automated collection of historical and daily racing data from racing-bet-data.com.

## Features

- **Database Schema**: Complete PostgreSQL schema for UK/IRE racing data
- **CSV/Excel Parser**: Robust parser for handling racing data files
- **Database Importer**: Transaction-safe importer with get-or-create logic
- **Command-Line Tools**: Scripts for manual data operations
- **REST API**: Endpoints for triggering scrapes and viewing statistics
- **Playwright Scraper**: Placeholder for automated data collection (requires customization)

## Database Tables

### Core Tables
- `uk_tracks` - Racing venues/tracks
- `uk_horses` - Racing horses
- `uk_jockeys` - Jockeys
- `uk_trainers` - Trainers
- `uk_races` - Race events
- `uk_results` - Post-race results
- `uk_race_fields` - Pre-race field data
- `scraper_logs` - Audit trail

### Performance Views
- `uk_performance_stats` - Overall statistics
- `uk_horse_performance` - Horse win/place statistics
- `uk_jockey_performance` - Jockey win rates
- `uk_trainer_performance` - Trainer win rates

## Setup

### 1. Run Database Migration

```bash
npm run migrate
```

This will create all UK/IRE racing tables in your PostgreSQL database.

### 2. Install Playwright Browsers (Optional)

If you plan to use the automated scraper:

```bash
npx playwright install chromium
```

## Usage

### Command-Line Scripts

#### Import CSV/Excel File

```bash
# Import results file
npx tsx scripts/uk-racing/import-csv.ts --file=./data/results.csv --type=results

# Import ratings file
npx tsx scripts/uk-racing/import-csv.ts --file=./data/ratings.xlsx --type=ratings --date=2026-02-14
```

#### Scrape Daily Data (Placeholder)

```bash
# Scrape today's results
npx tsx scripts/uk-racing/scrape-daily-results.ts

# Scrape specific date
npx tsx scripts/uk-racing/scrape-daily-results.ts --date=2026-02-10

# Scrape ratings
npx tsx scripts/uk-racing/scrape-daily-ratings.ts
```

#### Batch Import Historical Data (Placeholder)

```bash
# Scrape date range
npx tsx scripts/uk-racing/scrape-historical-batch.ts --from=2026-01-01 --to=2026-01-31 --type=results
```

### API Endpoints

#### Scrape Results

```bash
POST /api/uk-racing/scrape/results
Content-Type: application/json

{
  "date": "2026-02-14"  // optional, defaults to today
}
```

#### Scrape Ratings

```bash
POST /api/uk-racing/scrape/ratings
Content-Type: application/json

{
  "date": "2026-02-14"  // optional, defaults to today
}
```

#### Upload & Import File

```bash
POST /api/uk-racing/import
Content-Type: multipart/form-data

file: <CSV or Excel file>
type: results|ratings
date: YYYY-MM-DD (optional)
```

#### View Scraper Logs

```bash
GET /api/uk-racing/logs?limit=50&type=results&status=success
```

Query parameters:
- `limit` - Number of logs to return (default: 50)
- `type` - Filter by scraper type: results, ratings, historical
- `status` - Filter by status: success, failed, partial

#### View Statistics

```bash
GET /api/uk-racing/stats
```

Returns:
- Overall statistics (total races, horses, jockeys, trainers)
- Scraper activity summary
- Top performers (horses, jockeys, trainers)
- Track distribution

## Data Format

### Results File (CSV/Excel)

Expected columns:
- Date of Race / Date
- Track / Course
- Race No / Race Number
- Horse
- Jockey
- Trainer
- Place
- Winning Distance
- Weight
- Age
- Official Rating / OR
- RBD Rating
- RBD Rank
- SP / Industry SP
- Betfair SP / BSP

### Ratings File (CSV/Excel)

Expected columns:
- Date
- Track / Course
- Race No / Race Number
- Horse
- Jockey
- Trainer
- Weight
- Age
- RBD Rating
- RBD Rank
- Forecasted Odds

## Data Formats

- **Weight**: Stone-pounds format (e.g., "11-8", "10-13")
- **Distance**: Racing format with fractions (e.g., "2m3½f", "1m7½f")
- **Winning Distance**: Racing format (e.g., "33¼", "nk", "hd")
- **Dates**: Multiple formats supported (DD-MM-YYYY, YYYY-MM-DD, etc.)

## Track Mapping

The system automatically determines if a track is UK or IRE based on track names. Common tracks are pre-mapped:

**UK Tracks**: Ascot, Cheltenham, Newmarket, York, Epsom, Goodwood, etc.
**IRE Tracks**: Curragh, Leopardstown, Galway, Fairyhouse, Punchestown, etc.

## Customization

### Playwright Scraper

The Playwright scraper (`lib/scrapers/racing-bet-data/scraper.ts`) is a placeholder implementation. To use it with racing-bet-data.com, you need to:

1. Inspect the site structure
2. Implement authentication if required
3. Add navigation logic for date selection
4. Add logic to trigger downloads
5. Handle download completion

### Column Mapping

If your CSV files have different column names, update the mappings in:
- `lib/scrapers/racing-bet-data/parser.ts` - `parseResultsData()` and `parseFieldsData()` functions

### Track Names

To add more track name mappings, edit:
- `lib/scrapers/racing-bet-data/config.ts` - `TRACK_NAME_MAPPINGS` object

## Architecture

### Data Flow

1. **Scrape/Upload** → CSV/Excel file obtained
2. **Parse** → File parsed into typed objects with validation
3. **Import** → Data imported into PostgreSQL with transactions
4. **Log** → Operation logged to `scraper_logs` table

### Transaction Safety

All imports use PostgreSQL transactions:
- Begin transaction
- For each row: Get-or-create reference data, insert/update main data
- Commit on success, rollback on error
- Log result to scraper_logs

### Duplicate Prevention

- Tracks, horses, jockeys, trainers: Unique by name
- Races: Unique by (date, track, race_number)
- Results/Fields: Unique by (race, horse)
- Scraper logs: All operations logged

## Troubleshooting

### Import Errors

Check the scraper logs:
```bash
GET /api/uk-racing/logs?status=failed
```

Or via database:
```sql
SELECT * FROM scraper_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
```

### Validation Errors

The parser uses Zod schemas for validation. Common issues:
- Invalid date formats
- Missing required fields (horse name, track name, race number)
- Invalid data types

### Database Connection

Ensure `DATABASE_URL` is set in your `.env.local` file:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

## Performance

- **Batch Size**: 100 records per transaction (configurable in `config.ts`)
- **Rate Limiting**: 2-second delay between scraper requests
- **File Retention**: Downloaded files kept for 7 days
- **Indexes**: Optimized indexes on all foreign keys and common query patterns

## Security

- All database operations use parameterized queries (SQL injection safe)
- File uploads validated for type (CSV/Excel only)
- **File size limit**: 50MB maximum to prevent resource exhaustion
- Uses `exceljs` library (no known vulnerabilities) instead of vulnerable `xlsx` package
- Temporary files cleaned up after processing
- Scraper respects rate limits to be respectful to source website

## Future Enhancements

- [ ] Admin UI for managing imports
- [ ] Scheduled automated scrapes (cron jobs)
- [ ] Real-time Playwright scraper implementation
- [ ] Data export functionality
- [ ] Performance analytics dashboard
- [ ] Integration with existing racing data views

## License

Part of the tradingtheraces-tech project.
