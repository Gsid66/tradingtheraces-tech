/**
 * Conditional migration runner
 * 
 * This script only runs migrations when:
 * - NODE_ENV is set to 'production', OR
 * - RENDER environment variable is set (indicating Render deployment)
 * 
 * This prevents migrations from running during local npm install while
 * ensuring they run automatically during Render deployments.
 */

import { spawnSync } from 'child_process';

// Check if we should run migrations
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER !== undefined;

if (isProduction || isRender) {
  console.log('🚀 Running migrations (production environment detected)...');
  
  // Run the actual migration script
  const result = spawnSync('npm', ['run', 'migrate'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle spawn errors (e.g., command not found)
  if (result.error) {
    console.error('❌ Failed to spawn migration process:', result.error.message);
    process.exit(1);
  }
  
  // Exit with the same code as the migration script
  // If result.status is null (e.g., process was killed), treat as failure
  if (result.status === null) {
    console.error('❌ Migration process terminated abnormally');
    process.exit(1);
  }
  process.exit(result.status);
} else {
  console.log('⏭️  Skipping migrations (development environment)');
  console.log('   To run migrations manually, use: npm run migrate');
  process.exit(0);
}
