#!/usr/bin/env node
/**
 * Find and delete unused media files
 * 
 * Scans all media files in:
 * - public/images/ (and subdirectories)
 * - src/assets/images/ (and subdirectories)
 * - src/assets/icons/ (and subdirectories)
 * 
 * Finds references in:
 * - Direct imports (import statements)
 * - Path references (/images/..., ../assets/...)
 * - Content files (.md files)
 * - Component files (.astro, .ts, .tsx, .js, .jsx)
 * - Icon registry (for icons)
 * 
 * Deletes unused files and commits to GitHub
 */

import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, rmdirSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';
import { execSync } from 'child_process';

// Media file extensions to check
const MEDIA_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif',
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.mp3', '.wav', '.ogg'
];

// Directories to scan
const SCAN_DIRECTORIES = [
  'public/images',
  'src/assets/images',
  'src/assets/icons'
];

// Essential files to preserve (never delete)
const PRESERVE_FILES = [
  'image-placeholder.png',
  'artist-placeholder.png',
  'logo.svg',
  'favicon.svg'
];

// Directories to ignore
const IGNORE_DIRECTORIES = [
  'node_modules',
  'dist',
  '.git',
  '.astro'
];

/**
 * Recursively get all media files from a directory
 */
function getAllMediaFiles(dir, baseDir = dir) {
  const files = [];
  
  if (!existsSync(dir)) {
    return files;
  }
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip ignored directories
        if (IGNORE_DIRECTORIES.includes(entry)) {
          continue;
        }
        files.push(...getAllMediaFiles(fullPath, baseDir));
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (MEDIA_EXTENSIONS.includes(ext)) {
          const relativePath = relative(baseDir, fullPath);
          files.push({
            fullPath,
            relativePath,
            filename: entry,
            basename: basename(entry, ext),
            extension: ext,
            directory: dirname(relativePath)
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Normalize path for comparison (handle different path formats)
 */
function normalizePath(path) {
  return path
    .replace(/\\/g, '/')  // Normalize slashes
    .toLowerCase()         // Case insensitive
    .replace(/^\/+/, '')  // Remove leading slashes
    .replace(/\/+$/, '');  // Remove trailing slashes
}

/**
 * Extract filename from various path formats
 */
function extractFilename(path) {
  // Remove query strings and hashes
  path = path.split('?')[0].split('#')[0];
  
  // Extract filename
  const filename = basename(path);
  const ext = extname(filename);
  const name = basename(filename, ext);
  
  return { filename, name, ext };
}

/**
 * Check if a file is referenced in content
 */
function isFileReferenced(file, content, filePath) {
  const normalizedContent = content.toLowerCase();
  
  // Check for direct filename match
  if (normalizedContent.includes(file.filename.toLowerCase())) {
    return true;
  }
  
  // Check for basename match (without extension)
  if (normalizedContent.includes(file.basename.toLowerCase())) {
    return true;
  }
  
  // Check for relative path references
  const relativePath = normalizePath(file.relativePath);
  if (normalizedContent.includes(relativePath)) {
    return true;
  }
  
  // Check for /images/... path format (for public/images files)
  if (file.relativePath.startsWith('images/')) {
    const publicPath = '/' + file.relativePath.replace(/\\/g, '/');
    if (normalizedContent.includes(publicPath.toLowerCase())) {
      return true;
    }
    // Also check without leading slash
    if (normalizedContent.includes(publicPath.substring(1).toLowerCase())) {
      return true;
    }
  }
  
  // Check for ../assets/... or ./assets/... references
  if (file.relativePath.includes('assets/')) {
    const assetPath = file.relativePath.replace(/\\/g, '/');
    // Check various relative path formats
    const patterns = [
      `../${assetPath}`,
      `./${assetPath}`,
      `../../${assetPath}`,
      `../../../${assetPath}`,
      assetPath
    ];
    for (const pattern of patterns) {
      if (normalizedContent.includes(normalizePath(pattern))) {
        return true;
      }
    }
  }
  
  // Check for icon usage (icons are referenced by name in Icon component)
  if (file.extension === '.svg' && file.relativePath.includes('icons/')) {
    const iconName = file.basename;
    // Check if icon name is referenced in Icon component usage (name="iconName")
    const iconPatterns = [
      `name="${iconName}"`,
      `name='${iconName}'`,
      `name={\"${iconName}\"}`,
      `name={'${iconName}'}`,
      `"${iconName}"`,
      `'${iconName}'`
    ];
    for (const pattern of iconPatterns) {
      if (normalizedContent.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }
  
  // Check for hash-based filenames (like in design-system components)
  // These are often referenced by hash only
  if (file.filename.match(/^[a-f0-9]{40}/)) {
    const hash = file.filename.substring(0, 40);
    if (normalizedContent.includes(hash)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find all code files to search
 */
function getAllCodeFiles() {
  const codeFiles = [];
  const extensions = ['.astro', '.ts', '.tsx', '.js', '.jsx', '.md', '.mjs', '.css'];
  
  function scanDirectory(dir) {
    if (!existsSync(dir)) {
      return;
    }
    
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!IGNORE_DIRECTORIES.includes(entry)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = extname(entry).toLowerCase();
          if (extensions.includes(ext)) {
            codeFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error.message);
    }
  }
  
  // Scan src directory
  scanDirectory('src');
  
  // Scan root for config files
  if (existsSync('.pages.yml')) {
    codeFiles.push('.pages.yml');
  }
  
  return codeFiles;
}

/**
 * Check if icon is in icon registry
 */
function isIconInRegistry(iconName) {
  try {
    const registryPath = 'src/utils/iconRegistry.ts';
    if (existsSync(registryPath)) {
      const content = readFileSync(registryPath, 'utf-8');
      return content.includes(`"${iconName}"`) || content.includes(`'${iconName}'`);
    }
  } catch (error) {
    // Ignore errors
  }
  return false;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning for unused media files...\n');
  
  // Step 1: Get all media files
  console.log('📁 Scanning media files...');
  const allMediaFiles = [];
  for (const dir of SCAN_DIRECTORIES) {
    const files = getAllMediaFiles(dir, dir);
    allMediaFiles.push(...files);
    console.log(`  Found ${files.length} files in ${dir}`);
  }
  console.log(`\nTotal media files: ${allMediaFiles.length}\n`);
  
  // Step 2: Get all code files
  console.log('📄 Scanning code files...');
  const codeFiles = getAllCodeFiles();
  console.log(`  Found ${codeFiles.length} code files to search\n`);
  
  // Step 3: Read all code files
  console.log('🔎 Searching for references...');
  const fileContents = new Map();
  for (const filePath of codeFiles) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      fileContents.set(filePath, content);
    } catch (error) {
      console.error(`  Error reading ${filePath}:`, error.message);
    }
  }
  
  // Step 4: Check each media file for references
  const unusedFiles = [];
  const usedFiles = [];
  
  for (const file of allMediaFiles) {
    // Skip preserved files
    if (PRESERVE_FILES.includes(file.filename)) {
      usedFiles.push(file);
      continue;
    }
    
    // Check if icon is in registry
    if (file.relativePath.includes('icons/') && isIconInRegistry(file.basename)) {
      usedFiles.push(file);
      continue;
    }
    
    let isUsed = false;
    
    // Check all code files
    for (const [filePath, content] of fileContents) {
      if (isFileReferenced(file, content, filePath)) {
        isUsed = true;
        break;
      }
    }
    
    if (isUsed) {
      usedFiles.push(file);
    } else {
      unusedFiles.push(file);
    }
  }
  
  // Step 5: Report results
  console.log(`\n✅ Used files: ${usedFiles.length}`);
  console.log(`❌ Unused files: ${unusedFiles.length}\n`);
  
  if (unusedFiles.length === 0) {
    console.log('🎉 No unused files found!');
    return;
  }
  
  // Step 6: Show unused files
  console.log('Unused files:');
  for (const file of unusedFiles) {
    console.log(`  - ${file.relativePath}`);
  }
  
  // Step 7: Delete unused files
  console.log(`\n🗑️  Deleting ${unusedFiles.length} unused files...`);
  const deletedFiles = [];
  const deletedDirs = new Set();
  
  for (const file of unusedFiles) {
    try {
      unlinkSync(file.fullPath);
      deletedFiles.push(file);
      deletedDirs.add(dirname(file.fullPath));
      console.log(`  Deleted: ${file.relativePath}`);
    } catch (error) {
      console.error(`  Error deleting ${file.relativePath}:`, error.message);
    }
  }
  
  // Step 8: Remove empty directories
  console.log('\n🧹 Cleaning up empty directories...');
  const sortedDirs = Array.from(deletedDirs).sort((a, b) => b.length - a.length); // Sort by length descending
  for (const dir of sortedDirs) {
    try {
      if (existsSync(dir)) {
        const entries = readdirSync(dir);
        if (entries.length === 0) {
          rmdirSync(dir);
          console.log(`  Removed empty directory: ${dir}`);
        }
      }
    } catch (error) {
      // Directory not empty or doesn't exist, ignore
    }
  }
  
  // Step 9: Commit and push to GitHub
  if (deletedFiles.length > 0) {
    console.log('\n📝 Committing changes to Git...');
    try {
      // Stage all deletions
      execSync('git add -A', { stdio: 'inherit' });
      
      // Commit
      execSync(`git commit -m "Remove unused media files (${deletedFiles.length} files)"`, { stdio: 'inherit' });
      
      // Push to GitHub
      console.log('\n🚀 Pushing to GitHub...');
      execSync('git push', { stdio: 'inherit' });
      
      console.log('\n✅ Successfully deleted and committed unused media files!');
    } catch (error) {
      console.error('\n❌ Error committing/pushing to Git:', error.message);
      console.log('Files have been deleted locally. Please commit manually.');
    }
  }
}

// Run the script
main();
