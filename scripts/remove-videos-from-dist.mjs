#!/usr/bin/env node
/**
 * Remove videos from dist/ directory after build
 * Videos are served from R2, not needed in Pages deployment
 * This fixes Cloudflare Pages 25MB file size limit
 */

import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const videosDir = join('dist', 'images', 'videos');

if (existsSync(videosDir)) {
  rmSync(videosDir, { recursive: true, force: true });
  console.log('✓ Removed videos from dist/ (videos are served from R2)');
} else {
  console.log('No videos directory found in dist/');
}
