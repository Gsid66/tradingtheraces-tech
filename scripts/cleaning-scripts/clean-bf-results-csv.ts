import * as fs from 'fs';
import * as path from 'path';

interface CleaningStats {
  totalRows: number;
  duplicateRows: number;
  invalidRows: number;
  cleanedRows: number;
  uniqueKeyDuplicates: number;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function parseDate(raw: string): ValidationResult {
  const parts = raw.trim().split('/');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Invalid date format - expected DD/MM/YYYY' };
  }
  const [day, month, year] = parts;
  if (!day || !month || !year) {
    return { isValid: false, error: 'Missing date component' };
  }
  // Basic validation
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) {
    return { isValid: false, error: 'Invalid date values' };
  }
  return { isValid: true };
}

function cleanCSV(inputPath: string, outputPath: string): CleaningStats {
  const stats: CleaningStats = {
    totalRows: 0,
    duplicateRows: 0,
    invalidRows: 0,
    cleanedRows: 0,
    uniqueKeyDuplicates: 0,
  };

  // Read the file
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n').map(l => l.trimEnd());

  if (lines.length === 0) {
    throw new Error('File is empty');
  }

  // Process header
  const header = lines[0].split('\t');
  const colIndex: Record<string, number> = {};
  header.forEach((col, i) => {
    const normalized = col.trim().toLowerCase();
    colIndex[normalized] = i;
  });

  // Validate required columns exist
  const requiredColumns = ['date', 'track', 'race', 'horse'];
  for (const required of requiredColumns) {
    if (colIndex[required] === undefined) {
      throw new Error(`Missing required column: ${required}. Found: ${header.map(c => `"${c.trim()}"`).join(', ')}`);
    }
  }

  // Track seen rows
  const seenExactRows = new Set<string>();
  const uniqueKeyMap = new Map<string, string>(); // key -> full row
  const cleanedLines: string[] = [lines[0]]; // Start with header

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    stats.totalRows++;

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Check for exact duplicate
    const normalizedLine = line.trim();
    if (seenExactRows.has(normalizedLine)) {
      stats.duplicateRows++;
      console.log(`Row ${i + 1}: Exact duplicate removed`);
      continue;
    }
    seenExactRows.add(normalizedLine);

    const cols = line.split('\t');

    // Validate required fields
    const dateRaw = cols[colIndex['date']]?.trim();
    const track = cols[colIndex['track']]?.trim();
    const raceRaw = cols[colIndex['race']]?.trim();
    const horse = cols[colIndex['horse']]?.trim();
    const numberRaw = cols[colIndex['number']]?.trim() || '';

    if (!dateRaw) {
      stats.invalidRows++;
      console.log(`Row ${i + 1}: Missing Date - skipped`);
      continue;
    }

    if (!track) {
      stats.invalidRows++;
      console.log(`Row ${i + 1}: Missing Track - skipped`);
      continue;
    }

    if (!horse) {
      stats.invalidRows++;
      console.log(`Row ${i + 1}: Missing Horse - skipped`);
      continue;
    }

    // Validate date format
    const dateValidation = parseDate(dateRaw);
    if (!dateValidation.isValid) {
      stats.invalidRows++;
      console.log(`Row ${i + 1}: ${dateValidation.error} (${dateRaw}) - skipped`);
      continue;
    }

    // Validate race number
    const race = parseInt(raceRaw, 10);
    if (isNaN(race) || race < 1) {
      stats.invalidRows++;
      console.log(`Row ${i + 1}: Invalid Race number (${raceRaw}) - skipped`);
      continue;
    }

    // Create unique key (based on the database constraint)
    // Adjust this based on your actual unique constraint
    const uniqueKey = `${dateRaw}|${track}|${race}|${numberRaw}`;

    // Check for duplicate unique key
    if (uniqueKeyMap.has(uniqueKey)) {
      stats.uniqueKeyDuplicates++;
      console.log(`Row ${i + 1}: Duplicate unique key (Date: ${dateRaw}, Track: ${track}, Race: ${race}, Number: ${numberRaw}) - keeping last occurrence`);
    }

    // Store/update with this row (last occurrence wins)
    uniqueKeyMap.set(uniqueKey, line);
  }

  // Add all unique rows to output
  for (const line of uniqueKeyMap.values()) {
    cleanedLines.push(line);
    stats.cleanedRows++;
  }

  // Write cleaned file
  fs.writeFileSync(outputPath, cleanedLines.join('\n'), 'utf-8');

  return stats;
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: ts-node clean-bf-results-csv.ts <input-file> [output-file]');
  console.error('Example: ts-node clean-bf-results-csv.ts data.csv data_cleaned.csv');
  process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1] || inputPath.replace(/\.csv$/, '_cleaned.csv');

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

console.log(`Cleaning CSV file: ${inputPath}`);
console.log(`Output will be saved to: ${outputPath}`);
console.log('---');

try {
  const stats = cleanCSV(inputPath, outputPath);

  console.log('\n=== Cleaning Complete ===');
  console.log(`Total rows processed: ${stats.totalRows}`);
  console.log(`Exact duplicates removed: ${stats.duplicateRows}`);
  console.log(`Invalid rows removed: ${stats.invalidRows}`);
  console.log(`Unique key duplicates resolved: ${stats.uniqueKeyDuplicates}`);
  console.log(`Clean rows in output: ${stats.cleanedRows}`);
  console.log(`\nCleaned file saved to: ${outputPath}`);

  if (stats.duplicateRows > 0 || stats.invalidRows > 0 || stats.uniqueKeyDuplicates > 0) {
    console.log('\n⚠️  Issues were found and fixed. Please review the output above.');
  } else {
    console.log('\n✅ No issues found! File was already clean.');
  }
} catch (error) {
  console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}