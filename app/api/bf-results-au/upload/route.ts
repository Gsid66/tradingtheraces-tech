import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { Readable } from 'stream';
import { parse } from 'csv-parse';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ERRORS = 50;
const BATCH_SIZE = 500;

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

function parseRow(
  record: Record<string, string>,
  rowNum: number,
  errors: string[]
): BFResultRow | null {
  try {
    const dateRaw = record['date']?.trim();
    if (!dateRaw) {
      errors.push(`Row ${rowNum}: Missing Date`);
      return null;
    }

    const horse = record['horse']?.trim();
    if (!horse) {
      errors.push(`Row ${rowNum}: Missing Horse`);
      return null;
    }

    const raceRaw = record['race']?.trim();
    const race = parseInt(raceRaw, 10);
    if (isNaN(race)) {
      errors.push(`Row ${rowNum}: Invalid Race: ${raceRaw}`);
      return null;
    }

    return {
      date: parseDate(dateRaw),
      track: record['track']?.trim() || '',
      race,
      distance: record['distance']?.trim() || null,
      class: record['class']?.trim() || null,
      market: parseBigInt(record['market'] || ''),
      selection: parseBigInt(record['selection'] || ''),
      number: parseIntOrNull(record['number'] || ''),
      horse,
      race_speed: record['race_speed']?.trim() || null,
      speed_cat: record['speed_cat']?.trim() || null,
      early_speed: parseNum(record['early_speed'] || ''),
      late_speed: parseIntOrNull(record['late_speed'] || ''),
      rp: parseNum(record['rp'] || ''),
      win_result: parseIntOrNull(record['win_result'] || ''),
      win_bsp: parseNum(record['win_bsp'] || ''),
      place_result: parseIntOrNull(record['place_result'] || ''),
      place_bsp: parseNum(record['place_bsp'] || ''),
      value: parseNum(record['value'] || ''),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`Row ${rowNum}: ${message}`);
    return null;
  }
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
        { success: false, message: 'Invalid file type. Only CSV files are supported' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }

    // Detect delimiter from first 4KB of file to avoid reading entire file
    const sniffBuffer = Buffer.from(await file.slice(0, 4096).arrayBuffer());
    const sniffStr = sniffBuffer.toString('utf8');
    const firstNewline = sniffStr.indexOf('\n');
    const headerLine = firstNewline >= 0 ? sniffStr.slice(0, firstNewline) : sniffStr;
    const delimiter = headerLine.includes('\t') ? '\t' : ',';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const parser = stream.pipe(
      parse({
        delimiter,
        columns: (header: string[]) => header.map((col) => col.trim().toLowerCase()),
        skip_empty_lines: true,
        relax_column_count: true,
        trim: false,
      })
    );

    const parseErrors: string[] = [];
    let rowNum = 1; // Tracks file row number; header is row 1, first data row = 2

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let totalProcessed = 0;
    const dbErrors: string[] = [];

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const COLS = 19;
        let batch: BFResultRow[] = [];

        const flushBatch = async (batchStartFileRow: number) => {
          if (batch.length === 0) return;
          const values: unknown[] = [];
          const placeholders: string[] = [];

          for (let j = 0; j < batch.length; j++) {
            const row = batch[j];
            const base = j * COLS + 1;
            placeholders.push(
              `(${Array.from({ length: COLS }, (_, k) => `$${base + k}`).join(',')})`
            );
            values.push(
              row.date, row.track, row.race, row.distance, row.class,
              row.market?.toString() ?? null, row.selection?.toString() ?? null,
              row.number, row.horse,
              row.race_speed, row.speed_cat, row.early_speed, row.late_speed, row.rp,
              row.win_result, row.win_bsp, row.place_result, row.place_bsp, row.value,
            );
          }

          try {
            const result = await client.query(
              `INSERT INTO bf_results_au (
                date, track, race, distance, class, market, selection, number, horse,
                race_speed, speed_cat, early_speed, late_speed, rp,
                win_result, win_bsp, place_result, place_bsp, value
              ) VALUES ${placeholders.join(',')}
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
              values
            );
            for (const r of result.rows) {
              if (r.inserted) { imported++; } else { updated++; }
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            dbErrors.push(`Batch starting at file row ${batchStartFileRow}: ${message}`);
            skipped += batch.length;
          }
          batch = [];
        };

        let batchStartFileRow = 2; // first data row is file row 2 (after header)
        for await (const record of parser) {
          rowNum++;
          if (parseErrors.length > MAX_ERRORS) continue;
          const row = parseRow(record as Record<string, string>, rowNum, parseErrors);
          if (row) {
            if (batch.length === 0) batchStartFileRow = rowNum;
            batch.push(row);
            totalProcessed++;
            if (batch.length >= BATCH_SIZE && dbErrors.length <= MAX_ERRORS) {
              await flushBatch(batchStartFileRow);
            }
          }
        }

        // Flush remaining rows
        if (dbErrors.length <= MAX_ERRORS) {
          await flushBatch(batchStartFileRow);
        } else {
          skipped += batch.length;
        }

        if (totalProcessed === 0 && parseErrors.length === 0) {
          await client.query('ROLLBACK');
        } else {
          await client.query('COMMIT');
        }
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }

    const allErrors = [...parseErrors, ...dbErrors];
    const executionTime = Date.now() - startTime;
    const recordsImported = imported + updated;

    if (totalProcessed === 0 && parseErrors.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid rows found in file', errors: allErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: dbErrors.length === 0,
      message:
        dbErrors.length === 0
          ? `Successfully imported ${recordsImported} records (${imported} new, ${updated} updated)`
          : `Imported ${recordsImported} records with ${dbErrors.length} errors`,
      recordsImported,
      recordsProcessed: totalProcessed,
      recordsSkipped: skipped,
      executionTime,
      errors: allErrors.length > 0 ? allErrors.slice(0, 10) : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in bf-results-au upload:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Failed to upload: ${message}`,
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}