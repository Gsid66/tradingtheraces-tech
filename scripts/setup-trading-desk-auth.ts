import * as readline from 'readline';
import * as bcrypt from 'bcryptjs';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setupTradingDeskAuth() {
  console.log('\n🔧 Trading Desk Authentication Setup\n');
  console.log('This script will create the authentication tables and set up initial credentials.\n');

  // Get admin credentials
  const adminUsername = await question('Enter admin username (default: admin): ') || 'admin';
  const adminPassword = await question('Enter admin password: ');
  
  if (!adminPassword) {
    console.error('❌ Admin password is required');
    rl.close();
    process.exit(1);
  }

  // Get initial user password
  const initialUserPassword = await question('Enter initial user password: ');
  
  if (!initialUserPassword || initialUserPassword.length < 6) {
    console.error('❌ User password is required and must be at least 6 characters');
    rl.close();
    process.exit(1);
  }

  rl.close();

  console.log('\n📊 Connecting to database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create tables
    console.log('\n📋 Creating tables...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_desk_auth (
        id SERIAL PRIMARY KEY,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ trading_desk_auth table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_desk_admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ trading_desk_admins table created');

    // Hash passwords
    console.log('\n🔐 Hashing passwords...');
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const userPasswordHash = await bcrypt.hash(initialUserPassword, 10);
    console.log('✅ Passwords hashed');

    // Insert admin credentials
    console.log('\n👤 Creating admin account...');
    await client.query(
      `INSERT INTO trading_desk_admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
      [adminUsername, adminPasswordHash]
    );
    console.log(`✅ Admin account created: ${adminUsername}`);

    // Insert initial user password
    console.log('\n🔑 Setting initial user password...');
    await client.query(
      `INSERT INTO trading_desk_auth (password_hash)
       VALUES ($1)`,
      [userPasswordHash]
    );
    console.log('✅ Initial user password set');

    console.log('\n✨ Setup complete!\n');
    console.log('📍 Access URLs:');
    console.log('   Admin Panel: http://localhost:3000/trading-desk/admin');
    console.log('   User Login:  http://localhost:3000/trading-desk');
    console.log('\n📝 Admin Credentials:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🔐 User Password:');
    console.log(`   Password: ${initialUserPassword}`);
    console.log('\n⚠️  SECURITY WARNING: Save these credentials securely and clear your terminal history!');
    console.log('   Run: history -c (Linux/Mac) or Clear-History (PowerShell)\n');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

setupTradingDeskAuth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
