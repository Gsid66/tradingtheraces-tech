console.log('🔍 Debugging import paths\n');

// Test 1: Check if files exist
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.join(__dirname, '. .');
const libDir = path. join(rootDir, 'lib');
const integrationsDir = path.join(libDir, 'integrations');
const puntingFormDir = path.join(integrationsDir, 'punting-form');

console.log('Root directory:', rootDir);
console.log('Checking paths:\n');

console.log('1. lib folder exists? ', fs.existsSync(libDir));
console.log('2. integrations folder exists?', fs.existsSync(integrationsDir));
console.log('3. punting-form folder exists? ', fs.existsSync(puntingFormDir));

if (fs.existsSync(puntingFormDir)) {
  console.log('\n📁 Files in punting-form: ');
  const files = fs. readdirSync(puntingFormDir);
  files.forEach(file => {
    console.log(`   - ${file}`);
  });
}

// Test 2: Try importing
console.log('\n🔧 Attempting import...\n');

try {
  const module = require('../lib/integrations/punting-form');
  console.log('✅ Import successful!');
  console.log('   Exported functions:', Object.keys(module));
} catch (error:  any) {
  console.log('❌ Import failed:', error.message);
}