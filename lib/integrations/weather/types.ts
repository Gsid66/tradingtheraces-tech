/**
 * Comprehensive Weather Data Types
 * For historical storage and analysis of weather conditions
 */

export interface WeatherObservation {
  time: Date;
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  windCompass: string;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  weatherSymbol: string;
  weatherDescription: string;
  visibility: number;
  pressure: number;
  cloudCover: number;
  uvIndex: number;
}

export interface RaceWeatherConditions extends WeatherObservation {
  raceId: string;
  meetingId: string;
  trackName: string;
  raceNumber: number;
  raceStartTime: Date;
  trackBias: 'inside' | 'outside' | 'neutral';
  windImpact: 'light' | 'moderate' | 'strong' | 'severe';
  impactScore: number; // 1-10
  conditionsNote?: string;
}

export interface WeatherAnalysis {
  track: string;
  metric: string;
  sampleSize: number;
  correlationScore: number;
  categories: Array<{
    range: string;
    avgTime: number;
    stdDev: number;
    raceCount: number;
  }>;
  insights: string[];
}

export interface TrackBiasCalculation {
  direction: 'inside' | 'outside' | 'neutral';
  confidence: number;
  factors: {
    windDirection: number;
    windSpeed: number;
    precipitation: number;
    trackLayout?: string;
  };
}

export interface WindImpactAnalysis {
  category: 'light' | 'moderate' | 'strong' | 'severe';
  expectedTimeImpact: number; // seconds
  headwindComponent: number;
  crosswindComponent: number;
  description: string;
}

export interface WeatherCorrelation {
  metric: string;
  pearsonR: number;
  pValue: number;
  sampleSize: number;
  significant: boolean;
}

export interface WeatherExportOptions {
  format: 'csv' | 'json' | 'excel';
  track?: string;
  startDate?: Date;
  endDate?: Date;
  includeRaceResults?: boolean;
  meetingId?: string;
}

export interface HourlyForecastData {
  time: string;
  temperature: number;
  feelsLike?: number;
  windSpeed: number;
  windGust?: number;
  windDirection: number;
  weatherSymbol: string;
  precipitation: number;
  precipitationProbability?: number;
  humidity?: number;
}

export interface WeatherImpactPrediction {
  raceId: string;
  expectedTimeImpact: number; // +/- seconds vs average
  trackBiasPrediction: 'inside' | 'outside' | 'neutral';
  windImpactCategory: 'light' | 'moderate' | 'strong' | 'severe';
  confidence: number; // 0-1
  recommendations: string[];
}

export interface WeatherAnalysisQuery {
  track?: string;
  metric?: 'wind' | 'temperature' | 'humidity' | 'precipitation';
  startDate?: Date;
  endDate?: Date;
  minSampleSize?: number;
}

export interface WeatherPerformanceData {
  conditions: string;
  avgTime: number;
  avgWinMargin: number;
  raceCount: number;
  stdDev: number;
  winRate?: number;
}
