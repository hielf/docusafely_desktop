#!/usr/bin/env node
/**
 * Bundle Backend Script
 * 
 * Copies the pre-compiled backend processor from docusafely_core to the backend/ directory
 * for inclusion in the Electron app build.
 * 
 * Development workflow:
 * 1. Build the backend: cd ../docusafely_core && python build_nuitka.py
 * 2. Run this script: npm run prebuild (automatically runs before build)
 * 3. Build the frontend: npm run build
 */

const fs = require('fs');
const path = require('path');

const BACKEND_SOURCE = path.resolve(__dirname, '../../docusafely_core/dist');
const BACKEND_DEST = path.resolve(__dirname, '../backend');

console.log('[Bundle Backend] Starting...');

// Check if source exists
if (!fs.existsSync(BACKEND_SOURCE)) {
  console.error('[ERROR] Backend source not found at:', BACKEND_SOURCE);
  console.error('[ERROR] Please build the backend first:');
  console.error('  cd ../docusafely_core');
  console.error('  python build_nuitka.py');
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
  console.error('[ERROR] Please build the backend first:');
  console.error('  cd ../docusafely_core');
  console.error('  python build_nuitka.py');
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

