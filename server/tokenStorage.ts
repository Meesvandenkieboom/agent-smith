import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { OAuthTokens } from './oauth';

// New config directory
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.agentic');
const TOKEN_FILE = path.join(CONFIG_DIR, 'oauth-tokens.json');

// Legacy config directory for migration
const LEGACY_CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.agent-smith');
const LEGACY_TOKEN_FILE = path.join(LEGACY_CONFIG_DIR, 'oauth-tokens.json');

export interface StoredAuth {
  anthropic?: OAuthTokens;
}

/**
 * Migrate tokens from legacy .agent-smith directory to .agentic
 */
async function migrateLegacyTokens(): Promise<void> {
  try {
    // Check if legacy tokens exist and new ones don't
    if (fsSync.existsSync(LEGACY_TOKEN_FILE) && !fsSync.existsSync(TOKEN_FILE)) {
      // Ensure new directory exists
      await fs.mkdir(CONFIG_DIR, { recursive: true });
      // Copy tokens to new location
      await fs.copyFile(LEGACY_TOKEN_FILE, TOKEN_FILE);
      console.log('✅ Migrated OAuth tokens from ~/.agent-smith to ~/.agentic');
    }
  } catch {
    // Migration failed, will just use new directory
  }
}

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    // First try to migrate legacy tokens
    await migrateLegacyTokens();
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Directory might already exist, that's OK
  }
}

/**
 * Load OAuth tokens from storage
 */
export async function loadTokens(): Promise<StoredAuth> {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist or is invalid, return empty object
    return {};
  }
}

/**
 * Save OAuth tokens to storage
 */
export async function saveTokens(tokens: OAuthTokens): Promise<void> {
  await ensureConfigDir();
  const auth: StoredAuth = await loadTokens();
  auth.anthropic = tokens;
  await fs.writeFile(TOKEN_FILE, JSON.stringify(auth, null, 2), 'utf-8');
  console.log('✅ OAuth tokens saved successfully');
}

/**
 * Get Anthropic OAuth tokens if they exist
 */
export async function getAnthropicTokens(): Promise<OAuthTokens | null> {
  const auth = await loadTokens();
  return auth.anthropic || null;
}

/**
 * Clear all OAuth tokens (logout)
 */
export async function clearTokens(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
    console.log('✅ Logged out successfully');
  } catch {
    // File might not exist, that's OK
    console.log('✅ Logged out successfully');
  }
}

/**
 * Check if user is logged in with OAuth
 */
export async function isLoggedIn(): Promise<boolean> {
  const tokens = await getAnthropicTokens();
  return tokens !== null;
}
