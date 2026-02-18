import * as readline from 'readline';
import * as bcrypt from 'bcryptjs';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function resetAdminPassword() {
  console.log('\n🔑 Admin Password Reset\n');
  console.log('This script will reset or create admin credentials.\n');

  // Get admin credentials
  const adminUsername = await question('Enter admin username (default: admin): ') || 'admin';
  const adminPassword = await question('Enter new admin password: ');
  
  if (!adminPassword || adminPassword.length < 6) {
    console.error('❌ Password is required and must be at least 6 characters');
    rl.close();
    process.exit(1);
  }

  rl.close();

  console.log('\n📊 Connecting to database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Ensure table exists
    console.log('\n📋 Checking tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_desk_admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table verified');

    // Hash password
    console.log('\n🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    console.log('✅ Password hashed');

    // Insert or update admin credentials
    console.log('\n👤 Updating admin credentials...');
    await client.query(
      `INSERT INTO trading_desk_admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
      [adminUsername, passwordHash]
    );
    console.log(`✅ Admin credentials updated successfully`);

    console.log('\n✨ Password reset complete!\n');
    console.log('📝 New Admin Credentials:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  SECURITY WARNING:');
    console.log('   1. Save these credentials securely');
    console.log('   2. Clear your terminal history:');
    console.log('      - Linux/macOS: history -c');
    console.log('      - PowerShell: Clear-History');
    console.log('   3. Do not share these credentials over unsecure channels\n');

  } catch (error) {
    console.error('❌ Error during password reset:', error);
    throw error;
  } finally {
    await client.end();
  }
}

resetAdminPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
