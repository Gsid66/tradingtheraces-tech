import { config } from 'dotenv';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: '.env.local' });

// Check for test mode (dry-run)
const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('--test');

interface MigrationFile {
  filename: string;
  fullPath: string;
  order: number;
}

/**
 * Extracts numeric order from migration filename
 * Examples: 
 * - "007_create_scratchings_table.sql" -> 7
 * - "0004_add_scratchings_table.sql" -> 4
 */
function extractMigrationOrder(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999999;
}

/**
 * Scans directories for SQL migration files
 */
function findMigrationFiles(): MigrationFile[] {
  const migrations: MigrationFile[] = [];
  const baseDir = path.resolve(__dirname, '..');
  
  // Check both migrations directories
  const migrationDirs = [
    path.join(baseDir, 'migrations'),
    path.join(baseDir, 'drizzle', 'migrations'),
  ];

  for (const dir of migrationDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`⏭️  Directory not found: ${dir}`);
      continue;
    }

    const files = fs.readdirSync(dir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    for (const filename of sqlFiles) {
      migrations.push({
        filename,
        fullPath: path.join(dir, filename),
        order: extractMigrationOrder(filename),
      });
    }
  }

  // Sort by numeric order
  migrations.sort((a, b) => a.order - b.order);

  return migrations;
}

/**
 * Executes a single migration file
 */
async function executeMigration(
  client: Client,
  migration: MigrationFile
): Promise<{ success: boolean; error?: any; errorMessage?: string }> {
  try {
    console.log(`📄 Executing: ${migration.filename}`);
    
    const sql = fs.readFileSync(migration.fullPath, 'utf-8');
    
    await client.query(sql);
    
    console.log(`✅ Success: ${migration.filename}\n`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed: ${migration.filename}`);
    console.error(`   Error: ${errorMessage}\n`);
    return { success: false, error, errorMessage };
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  if (isDryRun) {
    console.log('🧪 Running in DRY-RUN mode (no database connection)\n');
  }

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    // If running in CI/development without DATABASE_URL, skip migrations
    if (process.env.CI || process.env.NODE_ENV !== 'production') {
      console.log('⏭️  Skipping migrations: DATABASE_URL not set (development/CI environment)');
      console.log('   To run migrations, set DATABASE_URL and run: npm run migrate\n');
      return;
    }
    
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL in your .env.local file or environment\n');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } // Render PostgreSQL requires this
      : undefined, // No SSL for local development
    connectionTimeoutMillis: 10000,
  });

  try {
    // Find all migration files
    const migrations = findMigrationFiles();
    
    if (migrations.length === 0) {
      console.log('⚠️  No migration files found');
      console.log('   Checked directories:');
      console.log('   - migrations/');
      console.log('   - drizzle/migrations/\n');
      return;
    }

    console.log(`📋 Found ${migrations.length} migration file(s):\n`);
    migrations.forEach(m => {
      console.log(`   ${m.order.toString().padStart(3, '0')}. ${m.filename}`);
    });
    console.log('');
    
    // If dry-run, just list migrations and exit
    if (isDryRun) {
      console.log('✅ Dry-run complete. No migrations were executed.\n');
      return;
    }

    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Execute migrations in order
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const migration of migrations) {
      const result = await executeMigration(client, migration);
      
      if (result.success) {
        successCount++;
      } else {
        // Check if error is about object already existing (safe to skip)
        // PostgreSQL error codes: 42P07 (duplicate_table), 42710 (duplicate_object)
        const pgError = result.error as any;
        const isDuplicateError = 
          pgError?.code === '42P07' || 
          pgError?.code === '42710' ||
          result.errorMessage?.includes('already exists');
        
        if (isDuplicateError) {
          console.log(`   ℹ️  Already exists, skipping...\n`);
          skipCount++;
        } else {
          failCount++;
          // Don't exit on error - continue with remaining migrations
          console.log(`   ⚠️  Continuing with remaining migrations...\n`);
        }
      }
    }

    // Print summary
    console.log('━'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total: ${migrations.length}`);
    console.log('━'.repeat(60));

    if (failCount > 0) {
      console.log('\n⚠️  Some migrations failed. Check the errors above.');
      console.log('   The application may not work correctly until these are resolved.\n');
    } else {
      console.log('\n🎉 All migrations completed successfully!\n');
    }

  } catch (error) {
    console.error('❌ Fatal error during migration:');
    console.error(error);
    process.exit(1);
  } finally {
    if (!isDryRun) {
      await client.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('❌ Unexpected error:');
  console.error(error);
  process.exit(1);
});
