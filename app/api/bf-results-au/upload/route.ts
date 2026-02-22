import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// Security: Limit file size to prevent DoS attacks
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ERRORS = 50;
const MAX_REPORTED_ERRORS = 20;

const REQUIRED_COLUMNS = [
  'Date', 'Track', 'Race', 'Horse',
];

interface BFResultRow {
  date: string;
  track: string;
  race: number;
  distance: string | null;
  class: string | null;
  market: bigint | null;
  selection: bigint | null;
  number: number | null;
  horse: string;
  race_speed: string | null;
  speed_cat: string | null;
  early_speed: number | null;
  late_speed: number | null;
  rp: number | null;
  win_result: number | null;
  win_bsp: number | null;
  place_result: number | null;
  place_bsp: number | null;
  value: number | null;
}

function parseDate(raw: string): string {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const parts = raw.trim().split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  throw new Error(`Invalid date format: ${raw}`);
}

function parseNum(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const n = Number(val.trim());
  return isNaN(n) ? null : n;
}

function parseIntOrNull(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? null : n;
}

function parseBigInt(val: string): bigint | null {
  if (!val || val.trim() === '') return null;
  try {
    return BigInt(val.trim());
  } catch {
    return null;
  }
}

function parseCSV(content: string): { rows: BFResultRow[]; errors: string[] } {
  const lines = content.split('\n').map(l => l.trimEnd());
  const errors: string[] = [];
  const rows: BFResultRow[] = [];

  if (lines.length === 0) {
    throw new Error('File is empty');
  }

  const header = lines[0].split('\t');
  const colIndex: Record<string, number> = {};
  header.forEach((col, i) => {
    colIndex[col.trim()] = i;
  });

  for (const required of REQUIRED_COLUMNS) {
    if (colIndex[required] === undefined) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split('\t');

    try {
      const dateRaw = cols[colIndex['Date']]?.trim();
      if (!dateRaw) {
        errors.push(`Row ${i + 1}: Missing Date`);
        if (errors.length > MAX_ERRORS) break;
        continue;
      }

      const horse = cols[colIndex['Horse']]?.trim();
      if (!horse) {
        errors.push(`Row ${i + 1}: Missing Horse`);
        if (errors.length > MAX_ERRORS) break;
        continue;
      }

      const raceRaw = cols[colIndex['Race']]?.trim();
      const race = parseInt(raceRaw, 10);
      if (isNaN(race)) {
        errors.push(`Row ${i + 1}: Invalid Race value: ${raceRaw}`);
        if (errors.length > MAX_ERRORS) break;
        continue;
      }

      rows.push({
        date: parseDate(dateRaw),
        track: cols[colIndex['Track']]?.trim() || '',
        race,
        distance: cols[colIndex['Distance']]?.trim() || null,
        class: cols[colIndex['Class']]?.trim() || null,
        market: parseBigInt(cols[colIndex['Market']] || ''),
        selection: parseBigInt(cols[colIndex['Selection']] || ''),
        number: parseIntOrNull(cols[colIndex['Number']] || ''),
        horse,
        race_speed: cols[colIndex['Race_Speed']]?.trim() || null,
        speed_cat: cols[colIndex['Speed_Cat']]?.trim() || null,
        early_speed: parseNum(cols[colIndex['Early_Speed']] || ''),
        late_speed: parseIntOrNull(cols[colIndex['Late_Speed']] || ''),
        rp: parseNum(cols[colIndex['RP']] || ''),
        win_result: parseIntOrNull(cols[colIndex['WIN_RESULT']] || ''),
        win_bsp: parseNum(cols[colIndex['WIN_BSP']] || ''),
        place_result: parseIntOrNull(cols[colIndex['PLACE_RESULT']] || ''),
        place_bsp: parseNum(cols[colIndex['PLACE_BSP']] || ''),
        value: parseNum(cols[colIndex['Value']] || ''),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Row ${i + 1}: ${message}`);
      if (errors.length > MAX_ERRORS) break;
    }
  }

  return { rows, errors };
}

async function importResults(pool: Pool, rows: BFResultRow[]): Promise<{
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}> {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const row of rows) {
      try {
        const result = await client.query(
          `INSERT INTO bf_results_au (
            date, track, race, distance, class, market, selection, number, horse,
            race_speed, speed_cat, early_speed, late_speed, rp,
            win_result, win_bsp, place_result, place_bsp, value
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19
          )
          ON CONFLICT ON CONSTRAINT idx_bf_results_au_unique
          DO UPDATE SET
            distance = EXCLUDED.distance,
            class = EXCLUDED.class,
            market = EXCLUDED.market,
            selection = EXCLUDED.selection,
            horse = EXCLUDED.horse,
            race_speed = EXCLUDED.race_speed,
            speed_cat = EXCLUDED.speed_cat,
            early_speed = EXCLUDED.early_speed,
            late_speed = EXCLUDED.late_speed,
            rp = EXCLUDED.rp,
            win_result = EXCLUDED.win_result,
            win_bsp = EXCLUDED.win_bsp,
            place_result = EXCLUDED.place_result,
            place_bsp = EXCLUDED.place_bsp,
            value = EXCLUDED.value,
            updated_at = NOW()
          RETURNING id, (xmax = 0) AS inserted`,
          [
            row.date, row.track, row.race, row.distance, row.class,
            row.market, row.selection, row.number, row.horse,
            row.race_speed, row.speed_cat, row.early_speed, row.late_speed, row.rp,
            row.win_result, row.win_bsp, row.place_result, row.place_bsp, row.value,
          ]
        );

        if (result.rowCount && result.rowCount > 0) {
          if (result.rows[0].inserted) {
            imported++;
          } else {
            updated++;
          }
        } else {
          skipped++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${row.date} ${row.track} R${row.race} #${row.number}: ${message}`);
        if (errors.length > MAX_ERRORS) {
          await client.query('ROLLBACK');
          return { imported, updated, skipped, errors };
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    const message = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`Transaction error: ${message}`);
  } finally {
    client.release();
  }

  return { imported, updated, skipped, errors };
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only CSV and TXT files are supported' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }

    const content = await file.text();

    let rows: BFResultRow[];
    let parseErrors: string[];
    try {
      const parsed = parseCSV(content);
      rows = parsed.rows;
      parseErrors = parsed.errors;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { success: false, message: `Failed to parse file: ${message}` },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid records found in file' },
        { status: 400 }
      );
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      const result = await importResults(pool, rows);
      const executionTime = Date.now() - startTime;
      const allErrors = [...parseErrors, ...result.errors];

      return NextResponse.json({
        success: allErrors.length === 0,
        recordsImported: result.imported,
        recordsUpdated: result.updated,
        recordsSkipped: result.skipped,
        recordsProcessed: rows.length,
        executionTime,
        message: `Imported ${result.imported} new, updated ${result.updated} existing records`,
        errors: allErrors.length > 0 ? allErrors.slice(0, MAX_REPORTED_ERRORS) : undefined,
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in Betfair Results AU upload:', error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to upload results: ${message}`,
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
