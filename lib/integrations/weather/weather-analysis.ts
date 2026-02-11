/**
 * Weather Analysis and Impact Calculations
 * 
 * Functions to calculate track bias, wind impact, and weather effects on racing
 */

import { degreesToCompass } from './met-norway-client';

export interface TrackBias {
  direction: 'favoring_inside' | 'favoring_outside' | 'neutral';
  confidence: number; // 0-1
  reasoning: string;
}

export interface WindImpact {
  category: 'light' | 'moderate' | 'strong' | 'severe';
  expectedTimeImpactSeconds: number;
  headwindComponent: number;
  crosswindComponent: number;
  description: string;
}

export interface WeatherImpactScore {
  score: number; // 1-10
  factors: {
    windScore: number;
    precipitationScore: number;
    temperatureScore: number;
    visibilityScore: number;
  };
  summary: string;
}

/**
 * Calculate track bias based on wind direction and speed
 * 
 * @param windDirection Wind direction in degrees (0-360)
 * @param windSpeed Wind speed in m/s
 * @param trackOrientation Optional track orientation (0-360), defaults to north-facing
 * @returns Track bias assessment
 */
export function calculateTrackBias(
  windDirection: number,
  windSpeed: number,
  trackOrientation: number = 0
): TrackBias {
  // Convert wind speed from m/s to km/h for easier interpretation
  const windKmh = windSpeed * 3.6;

  // Light winds don't create significant bias
  if (windKmh < 15) {
    return {
      direction: 'neutral',
      confidence: 0.9,
      reasoning: 'Light winds insufficient to create track bias',
    };
  }

  // Calculate relative wind direction to track
  const relativeDirection = (windDirection - trackOrientation + 360) % 360;

  // Strong crosswinds (roughly perpendicular to track) can favor inside/outside
  if (relativeDirection > 70 && relativeDirection < 110) {
    // Wind from the right (90° = east if track faces north)
    const confidence = Math.min(0.9, windKmh / 50);
    return {
      direction: 'favoring_inside',
      confidence,
      reasoning: `Strong crosswind from right (${windKmh.toFixed(0)} km/h) favors inside runners`,
    };
  } else if (relativeDirection > 250 && relativeDirection < 290) {
    // Wind from the left (270° = west if track faces north)
    const confidence = Math.min(0.9, windKmh / 50);
    return {
      direction: 'favoring_outside',
      confidence,
      reasoning: `Strong crosswind from left (${windKmh.toFixed(0)} km/h) favors outside runners`,
    };
  }

  // Headwinds or tailwinds affect all runners similarly
  return {
    direction: 'neutral',
    confidence: 0.7,
    reasoning: `Wind direction (${degreesToCompass(windDirection)}) creates no significant barrier bias`,
  };
}

/**
 * Calculate wind impact on race performance
 * 
 * @param windSpeed Wind speed in m/s
 * @param windGust Optional gust speed in m/s
 * @param windDirection Wind direction in degrees
 * @param raceDirection Direction the horses run (0-360), defaults to 0 (north)
 * @returns Wind impact assessment
 */
export function calculateWindImpact(
  windSpeed: number,
  windGust: number | undefined,
  windDirection: number,
  raceDirection: number = 0
): WindImpact {
  const windKmh = windSpeed * 3.6;
  const gustKmh = windGust ? windGust * 3.6 : windKmh;

  // Calculate wind components relative to race direction
  const relativeAngle = ((windDirection - raceDirection + 180) % 360) * (Math.PI / 180);
  const headwindComponent = windSpeed * Math.cos(relativeAngle);
  const crosswindComponent = windSpeed * Math.sin(relativeAngle);

  // Determine impact category based on wind speed
  let category: 'light' | 'moderate' | 'strong' | 'severe';
  let expectedTimeImpactSeconds: number;
  let description: string;

  if (windKmh < 15) {
    category = 'light';
    expectedTimeImpactSeconds = Math.abs(headwindComponent) * 0.1;
    description = 'Minimal wind impact on race times';
  } else if (windKmh < 30) {
    category = 'moderate';
    expectedTimeImpactSeconds = Math.abs(headwindComponent) * 0.3;
    description = `Moderate ${headwindComponent > 0 ? 'headwind' : 'tailwind'} will affect times`;
  } else if (windKmh < 45) {
    category = 'strong';
    expectedTimeImpactSeconds = Math.abs(headwindComponent) * 0.5;
    description = `Strong ${headwindComponent > 0 ? 'headwind' : 'tailwind'} expected to significantly impact race`;
  } else {
    category = 'severe';
    expectedTimeImpactSeconds = Math.abs(headwindComponent) * 0.8;
    description = `Severe wind conditions (${windKmh.toFixed(0)} km/h) will heavily impact performance`;
  }

  // Gusts add uncertainty
  if (gustKmh > windKmh * 1.5) {
    description += `. Gusty conditions (up to ${gustKmh.toFixed(0)} km/h) add unpredictability`;
  }

  return {
    category,
    expectedTimeImpactSeconds,
    headwindComponent,
    crosswindComponent,
    description,
  };
}

/**
 * Calculate overall weather impact score (1-10)
 * 
 * @param weatherData Complete weather data
 * @returns Overall impact score with breakdown
 */
export function calculateWeatherImpactScore(weatherData: {
  windSpeed: number;
  windGust?: number;
  precipitation: number;
  temperature: number;
  visibility?: number;
  humidity?: number;
}): WeatherImpactScore {
  // Wind score (0-4): Higher wind = higher score
  const windKmh = weatherData.windSpeed * 3.6;
  const gustKmh = weatherData.windGust ? weatherData.windGust * 3.6 : windKmh;
  let windScore = 0;
  if (windKmh > 15) windScore = 1;
  if (windKmh > 30) windScore = 2;
  if (windKmh > 45) windScore = 3;
  if (gustKmh > 60) windScore = 4;

  // Precipitation score (0-3): Rain affects track conditions
  let precipitationScore = 0;
  if (weatherData.precipitation > 0.5) precipitationScore = 1;
  if (weatherData.precipitation > 2) precipitationScore = 2;
  if (weatherData.precipitation > 5) precipitationScore = 3;

  // Temperature score (0-2): Extreme temps affect horses
  let temperatureScore = 0;
  if (weatherData.temperature < 5 || weatherData.temperature > 35) {
    temperatureScore = 1;
  }
  if (weatherData.temperature < 0 || weatherData.temperature > 40) {
    temperatureScore = 2;
  }

  // Visibility score (0-1): Poor visibility is rare but impactful
  let visibilityScore = 0;
  if (weatherData.visibility !== undefined && weatherData.visibility < 5) {
    visibilityScore = 1;
  }

  // Total score (max 10)
  const totalScore = Math.min(
    10,
    windScore + precipitationScore + temperatureScore + visibilityScore
  );

  // Generate summary
  let summary = '';
  if (totalScore <= 2) {
    summary = 'Ideal conditions - minimal weather impact expected';
  } else if (totalScore <= 4) {
    summary = 'Good conditions with slight weather considerations';
  } else if (totalScore <= 6) {
    summary = 'Moderate weather impact - adjust expectations accordingly';
  } else if (totalScore <= 8) {
    summary = 'Significant weather impact - major factor in race outcomes';
  } else {
    summary = 'Severe weather conditions - extreme impact on racing';
  }

  return {
    score: totalScore,
    factors: {
      windScore,
      precipitationScore,
      temperatureScore,
      visibilityScore,
    },
    summary,
  };
}

/**
 * Determine conditions note based on weather data
 */
export function generateConditionsNote(weatherData: {
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  temperature: number;
  weatherSymbol: string;
}): string {
  const notes: string[] = [];
  const windKmh = weatherData.windSpeed * 3.6;
  const compass = degreesToCompass(weatherData.windDirection);

  // Wind notes
  if (windKmh > 45) {
    notes.push(`Very strong ${compass} winds (${windKmh.toFixed(0)} km/h)`);
  } else if (windKmh > 30) {
    notes.push(`Strong ${compass} winds (${windKmh.toFixed(0)} km/h)`);
  } else if (windKmh > 15) {
    notes.push(`Moderate ${compass} winds (${windKmh.toFixed(0)} km/h)`);
  }

  // Precipitation notes
  if (weatherData.precipitation > 5) {
    notes.push('Heavy rain - track will be affected');
  } else if (weatherData.precipitation > 2) {
    notes.push('Moderate rain expected');
  } else if (weatherData.precipitation > 0.5) {
    notes.push('Light rain possible');
  }

  // Temperature notes
  if (weatherData.temperature > 35) {
    notes.push('Hot conditions - horse stamina affected');
  } else if (weatherData.temperature < 5) {
    notes.push('Cold conditions');
  }

  // Weather symbol specific notes
  if (weatherData.weatherSymbol.includes('thunder')) {
    notes.push('Thunderstorm risk');
  } else if (weatherData.weatherSymbol.includes('fog')) {
    notes.push('Poor visibility');
  }

  return notes.length > 0 ? notes.join('. ') + '.' : 'Standard conditions';
}
