#!/usr/bin/env node
/**
 * Replace large video files with lightweight placeholders in dist/ directory
 * This allows PagesCMS to see videos while keeping deployment size small
 * Videos are served from R2, but placeholders are needed for CMS access
 * This fixes Cloudflare Pages 25MB file size limit
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run the placeholder creation script instead of removing videos
const placeholderScript = join(__dirname, 'create-video-placeholders.mjs');

try {
  execSync(`node "${placeholderScript}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error creating video placeholders:', error.message);
  process.exit(1);
}
