#!/usr/bin/env node
/**
 * Sync videos from Cloudflare R2 to local public/images/videos folder
 * This ensures CMS can see videos that exist on R2 but may be missing locally
 * Run: npm run sync-from-r2
 */

import 'dotenv/config';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const TARGET_DIR = 'public/images/videos';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.log('R2 credentials not set. Skipping R2 sync.');
  console.log('To sync videos from R2, set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
  process.exit(0);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function listVideos() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'images/videos/',
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('Error listing videos from R2:', error.message);
    return [];
  }
}

async function downloadVideo(r2Key) {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
    });
    
    const response = await s3Client.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    const fileName = r2Key.replace('images/videos/', '');
    const localPath = join(TARGET_DIR, fileName);
    
    // Ensure directory exists
    if (!existsSync(TARGET_DIR)) {
      mkdirSync(TARGET_DIR, { recursive: true });
    }
    
    writeFileSync(localPath, buffer);
    console.log(`✓ Downloaded: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to download ${r2Key}:`, error.message);
    return false;
  }
}

console.log('Syncing videos from R2 to local folder...\n');
console.log(`Bucket: ${R2_BUCKET_NAME}`);
console.log(`Target: ${TARGET_DIR}\n`);

listVideos()
  .then(async (objects) => {
    if (objects.length === 0) {
      console.log('No videos found in R2 at images/videos/');
      return;
    }
    
    console.log(`Found ${objects.length} video(s) in R2:\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const obj of objects) {
      if (!obj.Key) continue;
      
      // Skip directories (keys ending with /)
      if (obj.Key.endsWith('/')) continue;
      
      const success = await downloadVideo(obj.Key);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`\n✓ Successfully downloaded: ${successCount} file(s)`);
    if (failCount > 0) {
      console.log(`✗ Failed: ${failCount} file(s)`);
    }
    console.log('\nR2 sync complete! Videos are now available in public/images/videos/ for CMS access.');
  })
  .catch((err) => {
    console.error('Error syncing from R2:', err);
    process.exit(1);
  });