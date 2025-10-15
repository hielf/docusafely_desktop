#!/usr/bin/env node
/**
 * Bundle Backend Script
 * 
 * Copies the pre-compiled backend processor from docusafely_core to the backend/ directory
 * for inclusion in the Electron app build.
 * 
 * This script assumes docusafely_core and docusafely_desktop are sibling directories:
 *   workspace/
 *     ├── docusafely_core/
 *     │   └── dist/processor
 *     └── docusafely_desktop/
 *         └── backend/dist/processor
 * 
 * Alternative: Build backend directly to frontend using --frontend-path:
 *   cd ../docusafely_core
 *   python build_interactive.py --frontend-path /absolute/path/to/docusafely_desktop
 * 
 * Development workflow (sibling directories):
 * 1. Build backend: cd ../docusafely_core && python build_interactive.py
 * 2. Run this script: npm run prebuild
 * 3. Run/build frontend: npm start or npm run build
 */

const fs = require('fs');
const path = require('path');

// Try to find backend source from environment variable or default location
const BACKEND_SOURCE = process.env.DOCUSAFELY_CORE_PATH
  ? path.resolve(process.env.DOCUSAFELY_CORE_PATH, 'dist')
  : path.resolve(__dirname, '../../docusafely_core/dist');
const BACKEND_DEST = path.resolve(__dirname, '../backend');

console.log('[Bundle Backend] Starting...');

// Check if source exists
if (!fs.existsSync(BACKEND_SOURCE)) {
  console.error('[ERROR] Backend source not found at:', BACKEND_SOURCE);
  console.error('[ERROR] Please build the backend first using one of these methods:');
  console.error('');
  console.error('Method 1 - Direct build to frontend (recommended):');
  console.error('  cd /path/to/docusafely_core');
  console.error('  python build_interactive.py --frontend-path ' + path.resolve(__dirname, '..'));
  console.error('');
  console.error('Method 2 - Build then bundle (if repos are siblings):');
  console.error('  cd ../docusafely_core');
  console.error('  python build_interactive.py');
  console.error('  cd ../docusafely_desktop');
  console.error('  npm run prebuild');
  console.error('');
  console.error('Method 3 - Set custom path:');
  console.error('  export DOCUSAFELY_CORE_PATH=/path/to/docusafely_core');
  console.error('  npm run prebuild');
  process.exit(1);
}

// Create dest directory if it doesn't exist
if (!fs.existsSync(BACKEND_DEST)) {
  fs.mkdirSync(BACKEND_DEST, { recursive: true });
  console.log('[INFO] Created backend directory:', BACKEND_DEST);
}

// Copy dist directory
const destDist = path.join(BACKEND_DEST, 'dist');
if (!fs.existsSync(destDist)) {
  fs.mkdirSync(destDist, { recursive: true });
}

// Copy processor executable
const isWindows = process.platform === 'win32';
const processorName = isWindows ? 'processor.exe' : 'processor';
const sourcePath = path.join(BACKEND_SOURCE, processorName);
const destPath = path.join(destDist, processorName);

if (!fs.existsSync(sourcePath)) {
  console.error('[ERROR] Processor executable not found at:', sourcePath);
  console.error('[ERROR] Please build the backend first using one of these methods:');
  console.error('');
  console.error('Method 1 - Direct build to frontend (recommended):');
  console.error('  cd /path/to/docusafely_core');
  console.error('  python build_interactive.py --frontend-path ' + path.resolve(__dirname, '..'));
  console.error('');
  console.error('Method 2 - Build then bundle (if repos are siblings):');
  console.error('  cd ../docusafely_core');
  console.error('  python build_interactive.py');
  console.error('  cd ../docusafely_desktop');
  console.error('  npm run prebuild');
  process.exit(1);
}

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log('[SUCCESS] Copied processor to:', destPath);

  // Make executable on Unix-like systems
  if (!isWindows) {
    fs.chmodSync(destPath, 0o755);
    console.log('[INFO] Made processor executable');
  }

  const stats = fs.statSync(destPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[INFO] Size: ${sizeMB} MB`);
  console.log('[Bundle Backend] Complete!');
} catch (error) {
  console.error('[ERROR] Failed to copy backend:', error.message);
  process.exit(1);
}

