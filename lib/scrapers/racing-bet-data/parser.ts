// CSV/Excel parser for UK & Ireland racing data
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { parse as parseDate } from 'date-fns';
import { RaceResult, RaceField, ParsedCSVData } from './types';
import { validateResults, validateFields } from './validator';
import { CSV_PARSE_OPTIONS } from './config';

/**
 * Parse Excel or CSV file
 */
export async function parseFile(filePath: string, type: 'results' | 'ratings'): Promise<ParsedCSVData> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.xlsx' || ext === '.xls') {
    return parseExcelFile(filePath, type);
  } else if (ext === '.csv') {
    return parseCSVFile(filePath, type);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Parse Excel file using xlsx library
 */
function parseExcelFile(filePath: string, type: 'results' | 'ratings'): ParsedCSVData {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const rawData = xlsx.utils.sheet_to_json(worksheet, { 
      raw: false, // Get formatted strings
      defval: null // Use null for empty cells
    });
    
    if (type === 'results') {
      return parseResultsData(rawData);
    } else {
      return parseFieldsData(rawData);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { errors: [`Failed to parse Excel file: ${message}`] };
  }
}

/**
 * Parse CSV file with encoding detection
 */
function parseCSVFile(filePath: string, type: 'results' | 'ratings'): ParsedCSVData {
  try {
    // Try different encodings
    let content: string | null = null;
    const encodings = [CSV_PARSE_OPTIONS.encoding, ...CSV_PARSE_OPTIONS.fallbackEncodings];
    
    for (const encoding of encodings) {
      try {
        content = fs.readFileSync(filePath, encoding as BufferEncoding);
        break;
      } catch (err) {
        continue;
      }
    }
    
    if (!content) {
      throw new Error('Failed to read file with any supported encoding');
    }
    
    // Parse CSV manually (simple parser)
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }
    
    // Extract headers
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    const rawData: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      rawData.push(row);
    }
    
    if (type === 'results') {
      return parseResultsData(rawData);
    } else {
      return parseFieldsData(rawData);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { errors: [`Failed to parse CSV file: ${message}`] };
  }
}

/**
 * Simple CSV line parser (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Parse results data (post-race)
 */
function parseResultsData(rawData: any[]): ParsedCSVData {
  const parsed: RaceResult[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < rawData.length; i++) {
    try {
      const row = rawData[i];
      
      // Map CSV columns to our schema
      const result: RaceResult = {
        race_date: parseDateField(row['Date of Race'] || row['Date'] || row['date']),
        track_name: normalizeString(row['Track'] || row['track'] || row['Course']),
        race_number: parseIntField(row['Race No'] || row['Race Number'] || row['race_number']),
        horse_name: normalizeString(row['Horse'] || row['horse']),
        jockey_name: normalizeString(row['Jockey'] || row['jockey']),
        trainer_name: normalizeString(row['Trainer'] || row['trainer']),
        
        place: parseIntField(row['Place'] || row['place'] || row['Pos']),
        winning_distance: normalizeString(row['Winning Distance'] || row['winning_distance'] || row['Dist']),
        finishing_time: normalizeString(row['Finishing Time'] || row['Time']),
        
        weight: normalizeString(row['Weight'] || row['weight'] || row['Wgt']),
        age: parseIntField(row['Age'] || row['age']),
        sex: normalizeString(row['Sex'] || row['sex']),
        drawn: parseIntField(row['Drawn'] || row['Draw']),
        headgear: normalizeString(row['Headgear'] || row['headgear']),
        
        official_rating: parseIntField(row['Official Rating'] || row['OR'] || row['official_rating']),
        rbd_rating: parseFloatField(row['RBD Rating'] || row['rbd_rating'] || row['Rating']),
        rbd_rank: parseIntField(row['RBD Rank'] || row['rbd_rank'] || row['Rank']),
        pace: normalizeString(row['Pace'] || row['pace']),
        stall: parseIntField(row['Stall'] || row['stall']),
        
        sp_fav: parseBooleanField(row['SP Fav'] || row['sp_fav'] || row['Fav']),
        industry_sp: normalizeString(row['Industry SP'] || row['SP'] || row['industry_sp']),
        betfair_sp: normalizeString(row['Betfair SP'] || row['betfair_sp'] || row['BSP']),
        ip_min: normalizeString(row['IP Min'] || row['ip_min']),
        ip_max: normalizeString(row['IP Max'] || row['ip_max']),
        
        course_winner: parseBooleanField(row['Course Winner'] || row['course_winner'] || row['CW']),
        distance_winner: parseBooleanField(row['Distance Winner'] || row['distance_winner'] || row['DW']),
        
        comment: normalizeString(row['Comment'] || row['comment']),
      };
      
      // Remove undefined fields
      Object.keys(result).forEach(key => {
        if (result[key as keyof RaceResult] === undefined) {
          delete result[key as keyof RaceResult];
        }
      });
      
      parsed.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${i + 1}: ${message}`);
    }
  }
  
  // Validate parsed data
  const { valid, errors: validationErrors } = validateResults(parsed);
  
  return {
    results: valid,
    errors: [...errors, ...validationErrors],
  };
}

/**
 * Parse fields data (pre-race)
 */
function parseFieldsData(rawData: any[]): ParsedCSVData {
  const parsed: RaceField[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < rawData.length; i++) {
    try {
      const row = rawData[i];
      
      // Map CSV columns to our schema
      const field: RaceField = {
        race_date: parseDateField(row['Date'] || row['date']),
        track_name: normalizeString(row['Track'] || row['track'] || row['Course']),
        race_number: parseIntField(row['Race No'] || row['Race Number'] || row['race_number']),
        horse_name: normalizeString(row['Horse'] || row['horse']),
        jockey_name: normalizeString(row['Jockey'] || row['jockey']),
        trainer_name: normalizeString(row['Trainer'] || row['trainer']),
        
        weight: normalizeString(row['Weight'] || row['weight'] || row['Wgt']),
        age: parseIntField(row['Age'] || row['age']),
        sex: normalizeString(row['Sex'] || row['sex']),
        drawn: parseIntField(row['Drawn'] || row['Draw']),
        headgear: normalizeString(row['Headgear'] || row['headgear']),
        
        official_rating: parseIntField(row['Official Rating'] || row['OR'] || row['official_rating']),
        rbd_rating: parseFloatField(row['RBD Rating'] || row['rbd_rating'] || row['Rating']),
        rbd_rank: parseIntField(row['RBD Rank'] || row['rbd_rank'] || row['Rank']),
        
        forecasted_odds: normalizeString(row['Forecasted Odds'] || row['Odds'] || row['forecasted_odds']),
        predicted_place: parseIntField(row['Predicted Place'] || row['predicted_place']),
        
        last_run_days: parseIntField(row['Last Run Days'] || row['last_run_days'] || row['Days Since Last Run']),
        runs_last_12m: parseIntField(row['Runs Last 12m'] || row['runs_last_12m'] || row['Runs']),
        wins_last_12m: parseIntField(row['Wins Last 12m'] || row['wins_last_12m'] || row['Wins']),
        places_last_12m: parseIntField(row['Places Last 12m'] || row['places_last_12m'] || row['Places']),
        
        course_form: normalizeString(row['Course Form'] || row['course_form']),
        distance_form: normalizeString(row['Distance Form'] || row['distance_form']),
        going_form: normalizeString(row['Going Form'] || row['going_form']),
        
        comment: normalizeString(row['Comment'] || row['comment']),
      };
      
      // Remove undefined fields
      Object.keys(field).forEach(key => {
        if (field[key as keyof RaceField] === undefined) {
          delete field[key as keyof RaceField];
        }
      });
      
      parsed.push(field);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${i + 1}: ${message}`);
    }
  }
  
  // Validate parsed data
  const { valid, errors: validationErrors } = validateFields(parsed);
  
  return {
    fields: valid,
    errors: [...errors, ...validationErrors],
  };
}

/**
 * Helper functions for parsing fields
 */

function parseDateField(value: any): string | undefined {
  if (!value) return undefined;
  
  const str = String(value).trim();
  if (!str) return undefined;
  
  // Try different date formats
  const formats = [
    'dd-MM-yyyy',
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'dd-MMM-yyyy',
  ];
  
  for (const format of formats) {
    try {
      const date = parseDate(str, format, new Date());
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return as YYYY-MM-DD
      }
    } catch {
      continue;
    }
  }
  
  // If all else fails, return the original string
  return str;
}

function parseIntField(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? undefined : num;
}

function parseFloatField(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseFloat(String(value));
  return isNaN(num) ? undefined : num;
}

function parseBooleanField(value: any): boolean | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const str = String(value).toLowerCase().trim();
  if (str === 'true' || str === 'yes' || str === '1' || str === 'y') return true;
  if (str === 'false' || str === 'no' || str === '0' || str === 'n') return false;
  return undefined;
}

function normalizeString(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  return str === '' ? undefined : str;
}
