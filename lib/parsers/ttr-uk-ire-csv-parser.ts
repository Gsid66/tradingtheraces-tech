// CSV parser for TTR UK/Ireland racing ratings data

export interface TTRRating {
  race_date: Date;
  track_name: string;
  race_name: string;
  race_number: number;
  saddle_cloth: number | null;
  horse_name: string;
  jockey_name: string;
  trainer_name: string;
  rating: number | null;
  price: number | null;
}

/**
 * Parse date in format "Sunday, 15th February 2026" to Date object
 */
export function parseDate(dateText: string): Date {
  if (!dateText || typeof dateText !== 'string') {
    throw new Error('Invalid date text');
  }

  const cleanDateText = dateText.trim();
  
  // Extract day, month, and year
  // Format: "Sunday, 15th February 2026" or "15th February 2026"
  const datePattern = /(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/i;
  const match = cleanDateText.match(datePattern);
  
  if (!match) {
    throw new Error(`Unable to parse date: ${dateText}`);
  }
  
  const [, day, monthName, year] = match;
  
  // Month name mapping
  const monthMap: { [key: string]: number } = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };
  
  const monthIndex = monthMap[monthName.toLowerCase()];
  if (monthIndex === undefined) {
    throw new Error(`Invalid month name: ${monthName}`);
  }
  
  const parsedDate = new Date(parseInt(year), monthIndex, parseInt(day));
  
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date constructed from: ${dateText}`);
  }
  
  return parsedDate;
}

/**
 * Parse race text "Race 1 - Full Race Name" to extract number and name
 */
export function parseRaceNumber(raceText: string): { number: number; name: string } {
  if (!raceText || typeof raceText !== 'string') {
    throw new Error('Invalid race text');
  }

  const cleanRaceText = raceText.trim();
  
  // Pattern: "Race 1 - Full Race Name" or "Race 1: Full Race Name"
  const racePattern = /Race\s+(\d+)\s*[-:]\s*(.+)/i;
  const match = cleanRaceText.match(racePattern);
  
  if (!match) {
    throw new Error(`Unable to parse race number from: ${raceText}`);
  }
  
  const [, numberStr, name] = match;
  const number = parseInt(numberStr, 10);
  
  if (isNaN(number)) {
    throw new Error(`Invalid race number: ${numberStr}`);
  }
  
  return {
    number,
    name: name.trim()
  };
}

/**
 * Parse price with currency symbols ($, £, €) to decimal number
 * Examples: "$2.15" → 2.15, "£3.40" → 3.4, "€5.00" → 5.0
 */
export function parsePrice(priceText: string): number | null {
  if (!priceText || typeof priceText !== 'string') {
    return null;
  }

  const cleanPriceText = priceText.trim();
  
  // Remove currency symbols and parse
  const priceValue = cleanPriceText.replace(/[$£€,]/g, '');
  const parsed = parseFloat(priceValue);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

/**
 * Parse a CSV line respecting quoted fields
 * Handles fields that contain the delimiter character when enclosed in quotes
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

/**
 * Parse CSV content with auto-detected delimiter (comma or tab)
 */
export function parseTTRCSV(csvContent: string): TTRRating[] {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('Invalid CSV content');
  }

  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row');
  }

  // Detect delimiter: check if first line has more commas or tabs
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const delimiter = commaCount > tabCount ? ',' : '\t';

  // Parse header row with detected delimiter
  const headers = parseCSVLine(lines[0], delimiter);
  
  // Validate required columns
  const requiredColumns = ['Date', 'Track', 'Race', 'Horse'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const ratings: TTRRating[] = [];
  const errors: string[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const values = parseCSVLine(line, delimiter);
      
      // Create a row object mapping headers to values
      const row: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Parse race number and name
      const raceInfo = parseRaceNumber(row['Race']);

      // Parse and validate data
      const rating: TTRRating = {
        race_date: parseDate(row['Date']),
        track_name: row['Track'] || '',
        race_name: raceInfo.name,
        race_number: raceInfo.number,
        saddle_cloth: row['SaddleCloth'] ? parseInt(row['SaddleCloth'], 10) : null,
        horse_name: row['Horse'] || '',
        jockey_name: row['Jockey'] || '',
        trainer_name: row['Trainer'] || '',
        rating: row['Rating'] ? parseFloat(row['Rating']) : null,
        price: parsePrice(row['Price'])
      };

      // Validate required fields
      if (!rating.track_name) {
        throw new Error('Missing track name');
      }
      if (!rating.horse_name) {
        throw new Error('Missing horse name');
      }

      ratings.push(rating);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${i + 1}: ${message}`);
      console.error(`Error parsing row ${i + 1}:`, error);
    }
  }

  if (ratings.length === 0 && errors.length > 0) {
    throw new Error(`Failed to parse any ratings. Errors:\n${errors.join('\n')}`);
  }

  if (errors.length > 0) {
    console.warn(`Parsed ${ratings.length} ratings with ${errors.length} errors`);
  }

  return ratings;
}
