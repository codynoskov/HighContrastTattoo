#!/usr/bin/env node
/**
 * Sync images from public/images to Cloudflare R2
 * Uploads to: {R2_BASE_URL}/images/{path}
 * Run after sync-images: npm run sync-images && npm run sync-to-r2
 */

import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const SOURCE_DIR = 'public/images';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.log('R2 credentials not set. Skipping R2 sync.');
  console.log('To sync images to R2, set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
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

function getContentType(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webmanifest: 'application/manifest+json',
    json: 'application/json',
  };
  return types[ext] || 'application/octet-stream';
}

async function uploadFile(localPath, r2Key) {
  try {
    const fileContent = readFileSync(localPath);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileContent,
      ContentType: getContentType(localPath),
    });
    
    await s3Client.send(command);
    console.log(`✓ Uploaded: ${r2Key}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to upload ${r2Key}:`, error.message);
    return false;
  }
}

async function syncDirectory(dir, prefix = 'images') {
  const files = readdirSync(dir);
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    const localPath = join(dir, file);
    const stat = statSync(localPath);
    const r2Key = prefix ? `${prefix}/${file}` : file;
    
    if (stat.isDirectory()) {
      const result = await syncDirectory(localPath, r2Key);
      successCount += result.success;
      failCount += result.fail;
    } else {
      const success = await uploadFile(localPath, r2Key);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
  }
  
  return { success: successCount, fail: failCount };
}

console.log('Syncing images to R2...\n');
console.log(`Bucket: ${R2_BUCKET_NAME}`);
console.log(`Base URL: ${process.env.PUBLIC_R2_BASE_URL || 'https://pub-5fa780a0c82a42df836a1dd9282c562b.r2.dev'}\n`);

syncDirectory(SOURCE_DIR)
  .then(({ success, fail }) => {
    console.log(`\n✓ Successfully uploaded: ${success} files`);
    if (fail > 0) {
      console.log(`✗ Failed: ${fail} files`);
    }
    console.log('\nR2 sync complete!');
  })
  .catch((err) => {
    console.error('Error syncing to R2:', err);
    process.exit(1);
  });
