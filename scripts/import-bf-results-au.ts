import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync } from 'fs';
import { Pool } from 'pg';

const MAX_ERRORS = 50;

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

  if (lines.length === 0) throw new Error('File is empty');

  const header = lines[0].split('\t');
  const colIndex: Record<string, number> = {};
  header.forEach((col, i) => { colIndex[col.trim()] = i; });

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split('\t');

    try {
      const dateRaw = cols[colIndex['Date']]?.trim();
      if (!dateRaw) { errors.push(`Row ${i + 1}: Missing Date`); continue; }

      const horse = cols[colIndex['Horse']]?.trim();
      if (!horse) { errors.push(`Row ${i + 1}: Missing Horse`); continue; }

      const raceRaw = cols[colIndex['Race']]?.trim();
      const race = parseInt(raceRaw, 10);
      if (isNaN(race)) { errors.push(`Row ${i + 1}: Invalid Race: ${raceRaw}`); continue; }

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
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`);
      if (errors.length > MAX_ERRORS) break;
    }
  }

  return { rows, errors };
}

async function importFile(filePath: string) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log(`📂 Reading file: ${filePath}\n`);
    const content = readFileSync(filePath, 'utf-8');
    const { rows, errors } = parseCSV(content);

    console.log(`📊 Parsed ${rows.length} rows, ${errors.length} parse errors\n`);
    if (errors.length > 0) {
      console.log('⚠️  Parse errors:');
      errors.slice(0, 20).forEach(e => console.log(`  • ${e}`));
    }

    if (rows.length === 0) {
      console.log('❌ No valid rows to import');
      return;
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const dbErrors: string[] = [];

    await client.query('BEGIN');

    for (const row of rows) {
      try {
        const result = await client.query(
          `INSERT INTO bf_results_au (
            date, track, race, distance, class, market, selection, number, horse,
            race_speed, speed_cat, early_speed, late_speed, rp,
            win_result, win_bsp, place_result, place_bsp, value
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
          ON CONFLICT ON CONSTRAINT idx_bf_results_au_unique
          DO UPDATE SET
            distance=EXCLUDED.distance, class=EXCLUDED.class,
            market=EXCLUDED.market, selection=EXCLUDED.selection,
            horse=EXCLUDED.horse, race_speed=EXCLUDED.race_speed,
            speed_cat=EXCLUDED.speed_cat, early_speed=EXCLUDED.early_speed,
            late_speed=EXCLUDED.late_speed, rp=EXCLUDED.rp,
            win_result=EXCLUDED.win_result, win_bsp=EXCLUDED.win_bsp,
            place_result=EXCLUDED.place_result, place_bsp=EXCLUDED.place_bsp,
            value=EXCLUDED.value, updated_at=NOW()
          RETURNING id, (xmax = 0) AS inserted`,
          [row.date, row.track, row.race, row.distance, row.class,
           row.market, row.selection, row.number, row.horse,
           row.race_speed, row.speed_cat, row.early_speed, row.late_speed, row.rp,
           row.win_result, row.win_bsp, row.place_result, row.place_bsp, row.value]
        );
        if (result.rowCount && result.rowCount > 0) {
          result.rows[0].inserted ? imported++ : updated++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        dbErrors.push(`${row.date} ${row.track} R${row.race}: ${err.message}`);
        if (dbErrors.length > MAX_ERRORS) break;
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Import complete:`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Updated:  ${updated}`);
    console.log(`   Skipped:  ${skipped}`);
    if (dbErrors.length > 0) {
      console.log(`\n⚠️  DB errors:`);
      dbErrors.slice(0, 20).forEach(e => console.log(`  • ${e}`));
    }
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: tsx scripts/import-bf-results-au.ts <path-to-csv>');
  process.exit(1);
}

importFile(filePath);
