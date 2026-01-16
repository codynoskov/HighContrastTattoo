#!/usr/bin/env node
/**
 * Create lightweight placeholder files for videos in dist/ directory
 * This allows PagesCMS to see videos while keeping deployment size small
 * Videos are served from R2, but placeholders are needed for CMS access
 */

import { readdirSync, writeFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const LOCAL_VIDEOS_DIR = 'public/images/videos';
const DIST_VIDEOS_DIR = join('dist', 'images', 'videos');

// Create a minimal MP4 header that's valid but empty
// This creates a tiny file that PagesCMS can detect as a video
function createVideoPlaceholder() {
  // Minimal valid MP4 header (ftyp box only, ~32 bytes)
  const ftyp = Buffer.from('ftyp');
  const brand = Buffer.from('isom'); // ISO Base Media
  const minorVersion = Buffer.from([0x00, 0x00, 0x00, 0x20]);
  const compatibleBrands = Buffer.from('isomiso2');
  
  // MP4 file structure: 4 bytes size + 4 bytes type + data
  const boxSize = Buffer.alloc(4);
  boxSize.writeUInt32BE(32, 0); // Total box size: 32 bytes
  
  return Buffer.concat([
    boxSize,
    ftyp,
    minorVersion,
    brand,
    Buffer.alloc(4), // padding
    compatibleBrands
  ]);
}

function createPlaceholders() {
  // Check if local videos directory exists
  if (!existsSync(LOCAL_VIDEOS_DIR)) {
    console.log('No local videos directory found. Skipping placeholder creation.');
    return;
  }
  
  // Ensure dist videos directory exists
  if (!existsSync(DIST_VIDEOS_DIR)) {
    const distImagesDir = dirname(DIST_VIDEOS_DIR);
    if (!existsSync(distImagesDir)) {
      const distDir = dirname(distImagesDir);
      if (!existsSync(distDir)) {
        console.error('dist/ directory not found. Run build first.');
        return;
      }
    }
    // Create the videos directory in dist
    mkdirSync(DIST_VIDEOS_DIR, { recursive: true });
  }
  
  // Get list of video files from local directory
  const videoFiles = readdirSync(LOCAL_VIDEOS_DIR).filter(file => 
    /\.(mp4|webm|mov)$/i.test(file)
  );
  
  if (videoFiles.length === 0) {
    console.log('No video files found in local directory. Skipping placeholder creation.');
    return;
  }
  
  console.log(`Creating placeholders for ${videoFiles.length} video(s)...\n`);
  
  const placeholder = createVideoPlaceholder();
  let createdCount = 0;
  
  for (const videoFile of videoFiles) {
    const placeholderPath = join(DIST_VIDEOS_DIR, videoFile);
    
    // Only create placeholder if file doesn't exist or is larger than 100 bytes
    // (meaning it's a real video file, not already a placeholder)
    if (!existsSync(placeholderPath)) {
      writeFileSync(placeholderPath, placeholder);
      createdCount++;
      console.log(`✓ Created placeholder: ${videoFile}`);
    } else {
      const stats = statSync(placeholderPath);
      if (stats.size > 100) {
        // Replace large file with placeholder
        writeFileSync(placeholderPath, placeholder);
        createdCount++;
        console.log(`✓ Replaced with placeholder: ${videoFile} (saved ${(stats.size - placeholder.length).toLocaleString()} bytes)`);
      } else {
        console.log(`- Placeholder already exists: ${videoFile}`);
      }
    }
  }
  
  console.log(`\n✓ Created ${createdCount} placeholder file(s)`);
  console.log('Videos are now visible in PagesCMS while being served from R2.');
}

createPlaceholders();