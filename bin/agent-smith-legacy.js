#!/usr/bin/env node
/**
 * Agent Smith (Legacy) - Migration wrapper to Agentic
 *
 * This script provides backward compatibility for users upgrading from
 * agent-smith to agentic. It handles the migration automatically.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  🔄 Agent Smith is now Agentic!                                 ║');
console.log('║                                                                 ║');
console.log('║  Migrating your data seamlessly...                              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Migration paths
const home = homedir();
const documentsDir = join(home, 'Documents');

const oldPaths = {
  data: join(documentsDir, 'agent-smith'),
  appData: join(documentsDir, 'agent-smith-app'),
  config: join(home, '.agent-smith')
};

const newPaths = {
  data: join(documentsDir, 'agentic'),
  appData: join(documentsDir, 'agentic-app'),
  config: join(home, '.agentic')
};

/**
 * Copy directory recursively (preserving structure)
 */
function copyDirRecursive(src, dest) {
  if (!existsSync(src)) return false;

  try {
    // Use Node's cpSync for recursive copy
    cpSync(src, dest, { recursive: true, force: false, errorOnExist: false });
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not copy ${src}: ${error.message}`);
    return false;
  }
}

/**
 * Migrate data from old paths to new paths
 */
function migrateData() {
  let migrated = false;

  // Migrate main data directory (chat sessions)
  if (existsSync(oldPaths.data) && !existsSync(newPaths.data)) {
    console.log('📁 Migrating chat sessions...');
    try {
      // Create parent directory if needed
      if (!existsSync(documentsDir)) {
        mkdirSync(documentsDir, { recursive: true });
      }

      // Copy instead of rename to preserve old data as backup
      if (copyDirRecursive(oldPaths.data, newPaths.data)) {
        console.log('   ✅ Chat sessions migrated to ~/Documents/agentic/');
        migrated = true;
      }
    } catch (error) {
      console.error('   ❌ Failed to migrate chat sessions:', error.message);
    }
  }

  // Migrate app data (database, etc.)
  if (existsSync(oldPaths.appData) && !existsSync(newPaths.appData)) {
    console.log('📁 Migrating app data...');
    try {
      if (copyDirRecursive(oldPaths.appData, newPaths.appData)) {
        console.log('   ✅ App data migrated to ~/Documents/agentic-app/');
        migrated = true;
      }
    } catch (error) {
      console.error('   ❌ Failed to migrate app data:', error.message);
    }
  }

  // Migrate config directory (OAuth tokens)
  if (existsSync(oldPaths.config) && !existsSync(newPaths.config)) {
    console.log('🔐 Migrating OAuth tokens...');
    try {
      if (copyDirRecursive(oldPaths.config, newPaths.config)) {
        console.log('   ✅ OAuth tokens migrated to ~/.agentic/');
        migrated = true;
      }
    } catch (error) {
      console.error('   ❌ Failed to migrate OAuth tokens:', error.message);
    }
  }

  if (migrated) {
    console.log('\n✅ Migration complete! Your old data is preserved as backup.\n');
    console.log('💡 Tip: Use "agentic" command instead of "agent-smith" from now on.\n');
  } else if (existsSync(newPaths.data) || existsSync(newPaths.appData)) {
    console.log('✅ Already migrated. Use "agentic" command from now on.\n');
  }

  return migrated;
}

// Run migration
migrateData();

// Check if this is an update request - if so, trigger the new update
const args = process.argv.slice(2);
if (args.includes('--update')) {
  console.log('🔄 Redirecting to agentic update...\n');
}

// Forward to agentic
const agenticPath = join(__dirname, 'agentic.js');
const proc = spawn('node', [agenticPath, ...args], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
