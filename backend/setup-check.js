/**
 * Setup Check Script
 * Run this to verify your backend configuration before starting
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDataDir } from './src/utils/storagePaths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('\n🔍 ACC Issues Backend - Setup Check\n');
console.log('='.repeat(50));

let hasErrors = false;
let hasWarnings = false;

// Check 1: .env file exists
console.log('\n📄 Checking .env file...');
if (fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('   ✅ .env file found');
} else {
  console.log('   ❌ .env file NOT found');
  console.log('   → Copy .env.example to .env and fill in your credentials');
  hasErrors = true;
}

// Check 2: APS credentials
console.log('\n🔑 Checking APS credentials...');
if (process.env.APS_CLIENT_ID && process.env.APS_CLIENT_ID !== 'your_client_id_here') {
  console.log('   ✅ APS_CLIENT_ID is set');
} else {
  console.log('   ❌ APS_CLIENT_ID is missing or using placeholder');
  console.log('   → Get from https://aps.autodesk.com/myapps');
  hasErrors = true;
}

if (process.env.APS_CLIENT_SECRET && process.env.APS_CLIENT_SECRET !== 'your_client_secret_here') {
  console.log('   ✅ APS_CLIENT_SECRET is set');
} else {
  console.log('   ❌ APS_CLIENT_SECRET is missing or using placeholder');
  console.log('   → Get from https://aps.autodesk.com/myapps');
  hasErrors = true;
}

if (process.env.APS_CALLBACK_URL) {
  console.log(`   ✅ APS_CALLBACK_URL: ${process.env.APS_CALLBACK_URL}`);
} else {
  console.log('   ⚠️  APS_CALLBACK_URL not set (using default)');
  hasWarnings = true;
}

// Check 3: ACC Project settings
console.log('\n🏗️  Checking ACC Project settings...');
if (process.env.ACC_PROJECT_ID && process.env.ACC_PROJECT_ID !== 'PLACEHOLDER_PROJECT_ID') {
  console.log(`   ✅ ACC_PROJECT_ID: ${process.env.ACC_PROJECT_ID}`);
} else {
  console.log('   ⚠️  ACC_PROJECT_ID is using placeholder');
  console.log('   → You can update this later or pass it in API requests');
  hasWarnings = true;
}

if (process.env.ACC_ASSIGNED_TO_ID && process.env.ACC_ASSIGNED_TO_ID !== 'PLACEHOLDER_ASSIGNED_TO_ID') {
  console.log(`   ✅ ACC_ASSIGNED_TO_ID: ${process.env.ACC_ASSIGNED_TO_ID}`);
} else {
  console.log('   ⚠️  ACC_ASSIGNED_TO_ID is using placeholder');
  console.log('   → You can update this later or pass it in API requests');
  hasWarnings = true;
}

// Check 4: Server settings
console.log('\n⚙️  Checking server settings...');
console.log(`   ✅ PORT: ${process.env.PORT || 3001}`);
console.log(`   ✅ FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

if (process.env.SESSION_SECRET && process.env.SESSION_SECRET !== 'your_random_session_secret_here') {
  console.log('   ✅ SESSION_SECRET is set');
} else {
  console.log('   ⚠️  SESSION_SECRET is using default or placeholder');
  console.log('   → Use a strong random string in production');
  hasErrors = true;
}

if (process.env.SYNC_PIN?.trim()) {
  console.log('   âœ… SYNC_PIN is set');
} else {
  console.log('   âŒ SYNC_PIN is missing');
  console.log('   â†’ Set it in the environment; never place it in frontend code');
  hasErrors = true;
}

// Check 5: Data directory
console.log('\n📁 Checking data directory...');
const dataDir = getDataDir();
if (fs.existsSync(dataDir)) {
  console.log('   ✅ data/ directory exists');
} else {
  console.log('   ℹ️  data/ directory will be created on first run');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:\n');

if (hasErrors) {
  console.log('   ❌ Configuration has ERRORS - please fix before starting');
  console.log('   → See messages above for details\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('   ⚠️  Configuration has warnings but server can start');
  console.log('   → Some features may not work until you configure all settings');
  console.log('   ✅ Run "npm start" or "npm run dev" to start the server\n');
} else {
  console.log('   ✅ All checks passed!');
  console.log('   ✅ Run "npm start" or "npm run dev" to start the server\n');
}

// Next steps
console.log('📝 Next Steps:\n');
console.log('   1. Fix any errors or warnings above');
console.log('   2. Start backend: npm run dev');
console.log('   3. Start frontend: cd ../Frontend/building-webapp && npm run dev');
console.log('   4. Open browser: http://localhost:5173/issues');
console.log('   5. Login with Autodesk and sync issues\n');
