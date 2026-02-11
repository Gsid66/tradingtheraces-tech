# Weather Analysis Guide

This guide explains how to use the weather analysis features to gain insights into how weather affects horse racing performance.

## Overview

The weather analysis system provides:
- Historical weather data storage and analysis
- Statistical correlations between weather and race outcomes
- Performance predictions based on weather conditions
- Track bias calculations
- Wind impact assessments

## Analysis Scripts

### 1. Weather Performance Analyzer

Analyze how different weather conditions affect race performance.

```bash
# Analyze wind impact across all tracks
npx tsx scripts/analyze-weather-performance.ts --metric=wind --track=all

# Analyze temperature impact at specific track
npx tsx scripts/analyze-weather-performance.ts --metric=temperature --track=randwick

# Analyze humidity impact
npx tsx scripts/analyze-weather-performance.ts --metric=humidity --track=flemington

# Jockey performance in specific conditions
npx tsx scripts/analyze-weather-performance.ts --jockey="Ryan Moore" --condition=rain

# Full track report
npx tsx scripts/analyze-weather-performance.ts --track=randwick --report=full
```

**Available Metrics:**
- `wind` - Wind speed impact on race times
- `temperature` - Temperature impact on performance
- `humidity` - Humidity effect on race outcomes

**Available Conditions:**
- `rain` - Races with precipitation
- `wind` - Races with strong winds (>30 km/h)
- `hot` - Hot conditions (>30°C)
- `cold` - Cold conditions (<10°C)

### 2. Correlation Calculator

Calculate statistical correlations between weather and race outcomes.

```bash
# Calculate correlations for all tracks
npx tsx scripts/calculate-weather-correlations.ts

# Track-specific correlations
npx tsx scripts/calculate-weather-correlations.ts --track=randwick

# Export correlations to file
npx tsx scripts/calculate-weather-correlations.ts --output=correlations.json
```

**What It Calculates:**
- Pearson correlation coefficients (r)
- Sample sizes
- Statistical significance
- Correlation strength (weak/moderate/strong/very strong)

**Metrics Analyzed:**
- Temperature vs Winning Time
- Wind Speed vs Winning Time
- Humidity vs Winning Time
- Weather metrics vs Winning Margin

**Interpretation:**
- `r > 0`: Positive correlation (as metric increases, target increases)
- `r < 0`: Negative correlation (as metric increases, target decreases)
- `|r| > 0.3`: Statistically significant (with n > 30)

### 3. Data Export Tool

Export weather data for external analysis (Excel, Python, R, etc.)

```bash
# Export all weather history for a track
npx tsx scripts/export-weather-data.ts --track=randwick --format=csv

# Export with date range
npx tsx scripts/export-weather-data.ts --start=2025-01-01 --end=2025-12-31 --format=csv

# Export with race results joined
npx tsx scripts/export-weather-data.ts --with-results --output=analysis.csv

# Export specific meeting
npx tsx scripts/export-weather-data.ts --meeting-id=abc123 --format=json

# Export as JSON for programmatic analysis
npx tsx scripts/export-weather-data.ts --track=all --format=json --output=weather-data.json
```

**Export Formats:**
- `csv` - Excel-compatible, spreadsheet-friendly
- `json` - Structured data for programming

**Export Options:**
- `--track=name` - Filter by track
- `--start=YYYY-MM-DD` - Start date
- `--end=YYYY-MM-DD` - End date
- `--with-results` - Include race results
- `--meeting-id=id` - Specific meeting
- `--output=filename` - Custom output filename

### 4. Race Weather Capture

Capture weather at exact race start times (for historical backfill or scheduled capture).

```bash
# Capture upcoming races (next 24 hours)
npx tsx scripts/capture-race-weather.ts

# Backfill last 7 days
npx tsx scripts/capture-race-weather.ts --backfill 7

# Specific meeting
npx tsx scripts/capture-race-weather.ts --meeting-id=abc123
```

This script:
- Fetches weather at race start time
- Calculates track bias
- Determines wind impact
- Calculates weather impact score
- Stores permanently in `race_weather_conditions`

## API Endpoints

### Weather Analysis API

Base URL: `/api/analysis/weather`

#### 1. Track Performance Analysis

```http
GET /api/analysis/weather?type=track-performance&track=randwick&metric=wind
```

**Parameters:**
- `type=track-performance` (required)
- `track` (required) - Track name
- `metric` (required) - `wind`, `temperature`, or `humidity`

**Response:**
```json
{
  "track": "randwick",
  "metric": "wind",
  "analysis": {
    "sampleSize": 150,
    "correlationScore": 0.45,
    "categories": [
      {
        "range": "Light (<15 km/h)",
        "avgTime": 63.2,
        "avgWinMargin": 1.8,
        "raceCount": 45,
        "stdDev": 2.1
      },
      ...
    ],
    "insights": [
      "150 races analyzed for randwick",
      "Time variation: 2.5s across wind conditions",
      "Significant wind impact detected"
    ]
  },
  "lastUpdated": "2026-02-11T07:30:00.000Z"
}
```

#### 2. Jockey Statistics by Condition

```http
GET /api/analysis/weather?type=jockey-stats&jockeyId=Ryan%20Moore&condition=rain
```

**Parameters:**
- `type=jockey-stats` (required)
- `jockeyId` (required) - Jockey name
- `condition` (required) - `rain`, `wind`, `hot`, `cold`

**Response:**
```json
{
  "jockeyId": "Ryan Moore",
  "condition": "rain",
  "stats": {
    "rides": 45,
    "wins": 12,
    "winRate": 26.67,
    "avgWinTime": 62.5,
    "avgWinMargin": 2.3
  },
  "lastUpdated": "2026-02-11T07:30:00.000Z"
}
```

#### 3. Optimal Conditions

```http
GET /api/analysis/weather?type=optimal-conditions&track=flemington
```

**Parameters:**
- `type=optimal-conditions` (required)
- `track` (required) - Track name

**Response:**
```json
{
  "track": "flemington",
  "optimalConditions": {
    "temperature": "22.5",
    "windSpeed": "12.3",
    "humidity": "55",
    "sampleSize": 20
  },
  "lastUpdated": "2026-02-11T07:30:00.000Z"
}
```

#### 4. Historical Weather Data

```http
GET /api/analysis/weather?type=historical&track=randwick&days=30
```

**Parameters:**
- `type=historical` (required)
- `track` (required) - Track name
- `days` (optional, default: 30) - Number of days

**Response:**
```json
{
  "track": "randwick",
  "days": 30,
  "historicalData": [
    {
      "date": "2026-02-11",
      "avgTemp": 28.5,
      "maxTemp": 32.1,
      "minTemp": 24.3,
      "avgWindKmh": 18.2,
      "maxWindKmh": 35.5,
      "totalPrecipitation": 2.5,
      "avgHumidity": 65.0
    },
    ...
  ],
  "lastUpdated": "2026-02-11T07:30:00.000Z"
}
```

#### 5. Weather Correlations

```http
GET /api/analysis/weather?type=correlations&track=randwick
```

**Parameters:**
- `type=correlations` (required)
- `track` (required) - Track name

**Response:**
```json
{
  "track": "randwick",
  "correlations": {
    "windVsTime": 0.42,
    "temperatureVsTime": 0.18,
    "humidityVsTime": -0.12,
    "windVsMargin": -0.08,
    "temperatureVsMargin": 0.05,
    "sampleSize": 150
  },
  "lastUpdated": "2026-02-11T07:30:00.000Z"
}
```

### Weather Prediction API

Base URL: `/api/analysis/weather/predict`

#### Predict Race Impact

```http
POST /api/analysis/weather/predict
Content-Type: application/json

{
  "raceId": "race123",
  "currentWeather": {
    "temperature": 28,
    "windSpeed": 8.5,
    "windGust": 12.3,
    "windDirection": 270,
    "humidity": 65,
    "precipitation": 0,
    "visibility": 10
  }
}
```

**GET Alternative:**
```http
GET /api/analysis/weather/predict?raceId=race123
```

**Response:**
```json
{
  "raceId": "race123",
  "track": "Randwick",
  "raceNumber": 5,
  "distance": 1600,
  "prediction": {
    "expectedTimeImpact": 0.8,
    "averageTime": 94.2,
    "predictedTime": 95.0,
    "trackBias": "neutral",
    "windImpactCategory": "moderate",
    "weatherImpactScore": 4,
    "confidence": 0.82,
    "recommendations": [
      "Moderate wind conditions may affect performance",
      "Standard conditions - minimal weather impact expected"
    ]
  },
  "weather": {
    "temperature": 28,
    "windSpeed": 8.5,
    "windDirection": 270,
    "humidity": 65,
    "precipitation": 0
  },
  "analysis": {
    "trackBiasReasoning": "Wind direction creates no significant barrier bias",
    "windImpactDescription": "Moderate headwind will affect times",
    "impactScoreSummary": "Good conditions with slight weather considerations",
    "sampleSize": 45
  },
  "lastUpdated": "2026-02-11T07:30:00.000Z"
}
```

## Understanding Weather Impact Scores

Weather impact scores range from 1-10:

### Score Breakdown

**1-2: Ideal Conditions** 🟢
- Light winds (<15 km/h)
- Comfortable temperature (15-28°C)
- No precipitation
- Good visibility
- *Expected impact*: ±0.2s variation

**3-4: Moderate Impact** 🟡
- Moderate winds (15-30 km/h)
- Warm conditions (28-32°C) or cool (10-15°C)
- Light precipitation possible
- *Expected impact*: ±0.5s variation

**5-7: Significant Impact** 🟠
- Strong winds (30-45 km/h)
- Hot (>32°C) or cold (<10°C)
- Moderate rain (2-5mm)
- *Expected impact*: ±1.5s variation

**8-10: Severe Conditions** 🔴
- Severe winds (>45 km/h)
- Extreme temperatures
- Heavy rain (>5mm)
- Poor visibility
- *Expected impact*: ±3s+ variation

## Track Bias Calculation

Track bias indicates which barrier positions are advantaged:

### Bias Types

**Inside Bias** (`favoring_inside`)
- Strong crosswind from the right
- Wet conditions on outside lanes
- Benefits low barrier numbers (1-4)

**Outside Bias** (`favoring_outside`)
- Strong crosswind from the left
- Benefits high barrier numbers
- Less congestion advantage

**Neutral** (`neutral`)
- Light winds or headwinds/tailwinds
- Standard conditions
- No significant barrier advantage

### Confidence Levels

Bias calculations include confidence scores:
- `0.9`: High confidence (strong evidence)
- `0.7`: Moderate confidence
- `0.5`: Low confidence (marginal effect)

## Wind Impact Categories

### Light (<15 km/h)
- Minimal impact on race times
- Normal race conditions
- No significant advantage/disadvantage

### Moderate (15-30 km/h)
- Slight time variations (±0.3s)
- May affect jockey tactics
- Consider wind direction

### Strong (30-45 km/h)
- Significant time impact (±0.5s)
- Major tactical consideration
- Headwinds slow, tailwinds quicken

### Severe (>45 km/h)
- Extreme impact (±0.8s+)
- Dangerous conditions possible
- Race times highly unpredictable

## Practical Analysis Examples

### Example 1: Pre-Race Assessment

```bash
# 1. Check upcoming race weather
curl "http://localhost:3000/api/analysis/weather/predict?raceId=race123"

# 2. Check track historical performance
npx tsx scripts/analyze-weather-performance.ts --track=randwick --report=full

# 3. Export data for detailed analysis
npx tsx scripts/export-weather-data.ts --track=randwick --with-results --format=csv
```

### Example 2: Jockey Weather Specialization

```bash
# Analyze specific jockey in rain
npx tsx scripts/analyze-weather-performance.ts --jockey="Hugh Bowman" --condition=rain

# Compare with hot conditions
npx tsx scripts/analyze-weather-performance.ts --jockey="Hugh Bowman" --condition=hot
```

### Example 3: Track Wind Sensitivity

```bash
# Analyze wind impact
npx tsx scripts/analyze-weather-performance.ts --metric=wind --track=flemington

# Calculate correlations
npx tsx scripts/calculate-weather-correlations.ts --track=flemington
```

## Data Retention Policy

### Track Weather (Rolling Cache)
- **Retention**: 48 hours
- **Purpose**: Current forecasts only
- **Cleanup**: Automatic daily

### Track Weather History
- **Retention**: 90 days detailed
- **Purpose**: Analysis and correlation
- **Cleanup**: Automatic with archival option

### Race Weather Conditions
- **Retention**: **PERMANENT**
- **Purpose**: Historical performance analysis
- **Cleanup**: Never deleted

Run cleanup manually:
```bash
npx tsx scripts/cleanup-weather-data.ts
```

## Best Practices

### 1. Data Collection
- Run `sync-weather-data.ts` hourly during race days
- Capture race-time conditions with `capture-race-weather.ts`
- Backfill historical data when needed

### 2. Analysis Frequency
- Daily: Run correlations for updated insights
- Weekly: Export data for deep analysis
- Monthly: Review and update models

### 3. API Usage
- Cache analysis results (5-minute TTL)
- Use batch endpoints when possible
- Monitor rate limits

### 4. Interpretation
- Require minimum sample sizes (n > 30)
- Consider confidence scores
- Account for track-specific patterns
- Combine with other form factors

## Troubleshooting

### No Weather Data Available
- Check if track coordinates exist
- Verify MET Norway API accessibility
- Run sync script manually

### Low Sample Sizes
- Need more historical data
- Consider using "all tracks" for general patterns
- Backfill historical races

### Unexpected Correlations
- Check data quality
- Verify race result accuracy
- Consider confounding variables

## Further Reading

- [MET Norway API Documentation](https://api.met.no/weatherapi/locationforecast/2.0/documentation)
- WEATHER_INTEGRATION.md - Technical implementation details
- Database schema documentation in migration files

## Support

For issues or questions:
1. Check script output and logs
2. Verify database schema is up to date
3. Test API endpoints directly
4. Review TypeScript compilation errors

---

**Last Updated**: February 11, 2026  
**Version**: 2.0 - Comprehensive Weather Analysis
