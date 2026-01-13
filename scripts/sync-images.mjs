#!/usr/bin/env node
/**
 * Sync images from src/assets/images to public/images
 * This ensures images uploaded via CMS (which go to src/assets/images)
 * are also available in public/images where Astro serves static files.
 * 
 * Run before build: npm run sync-images
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'fs';
import { join, basename } from 'path';

const SOURCE_DIR = 'src/assets/images';
const TARGET_DIR = 'public/images';

// Image extensions to sync
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif'];

function syncImages(sourceDir, targetDir) {
  if (!existsSync(sourceDir)) {
    console.log(`Source directory ${sourceDir} does not exist, skipping.`);
    return;
  }

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const files = readdirSync(sourceDir);
  let copiedCount = 0;

  for (const file of files) {
    const sourcePath = join(sourceDir, file);
    const targetPath = join(targetDir, file);
    const stat = statSync(sourcePath);

    if (stat.isDirectory()) {
      // Recursively sync subdirectories
      syncImages(sourcePath, targetPath);
    } else if (stat.isFile()) {
      const ext = file.toLowerCase().slice(file.lastIndexOf('.'));
      if (IMAGE_EXTENSIONS.includes(ext)) {
        // Only copy if target doesn't exist or source is newer
        if (!existsSync(targetPath) || stat.mtimeMs > statSync(targetPath).mtimeMs) {
          copyFileSync(sourcePath, targetPath);
          console.log(`Synced: ${file}`);
          copiedCount++;
        }
      }
    }
  }

  if (copiedCount > 0) {
    console.log(`\nSynced ${copiedCount} image(s) from ${sourceDir} to ${targetDir}`);
  }
}

console.log('Syncing images from src/assets/images to public/images...\n');
syncImages(SOURCE_DIR, TARGET_DIR);
console.log('\nImage sync complete!');
