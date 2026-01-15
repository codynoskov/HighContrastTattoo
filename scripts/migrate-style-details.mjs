#!/usr/bin/env node
/**
 * Migrate style markdown files: Move 'details' from frontmatter to body
 * 
 * This script:
 * 1. Reads each style .md file
 * 2. Extracts the 'details' field from frontmatter
 * 3. Removes 'details' from frontmatter
 * 4. Places the content in the markdown body (after the second ---)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const STYLES_DIR = 'src/content/styles';

function migrateStyleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  
  // Split into frontmatter and body
  const parts = content.split('---');
  
  if (parts.length < 3) {
    console.log(`⚠️  Skipping ${filePath}: Invalid frontmatter format`);
    return false;
  }
  
  const frontmatter = parts[1].trim();
  const existingBody = parts.slice(2).join('---').trim();
  
  // Extract details field from frontmatter
  const detailsMatch = frontmatter.match(/^details:\s*(.+?)(?=\n\w+:|$)/ms);
  
  if (!detailsMatch) {
    console.log(`⚠️  Skipping ${filePath}: No 'details' field found`);
    return false;
  }
  
  let detailsContent = detailsMatch[1].trim();
  
  // Handle YAML multiline strings (quoted or unquoted)
  // Remove quotes if present
  if ((detailsContent.startsWith('"') && detailsContent.endsWith('"')) ||
      (detailsContent.startsWith("'") && detailsContent.endsWith("'"))) {
    detailsContent = detailsContent.slice(1, -1);
  }
  
  // Handle YAML folded/block scalars (lines with indentation)
  // Remove leading indentation from each line
  const lines = detailsContent.split('\n');
  if (lines.length > 1) {
    // Find minimum indentation (excluding empty lines)
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    if (nonEmptyLines.length > 0) {
      const minIndent = Math.min(...nonEmptyLines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      }));
      
      // Remove the minimum indentation from all lines
      detailsContent = lines.map(line => {
        if (line.trim().length === 0) return '';
        return line.substring(minIndent);
      }).join('\n').trim();
    }
  }
  
  // Remove details from frontmatter
  const newFrontmatter = frontmatter.replace(/^details:\s*(.+?)(?=\n\w+:|$)/ms, '').trim();
  
  // Combine: frontmatter + body (with details content)
  const newBody = existingBody ? `${detailsContent}\n\n${existingBody}` : detailsContent;
  
  const newContent = `---\n${newFrontmatter}\n---\n\n${newBody}\n`;
  
  writeFileSync(filePath, newContent, 'utf-8');
  return true;
}

// Main execution
console.log('🔄 Migrating style files: details → body\n');

const files = readdirSync(STYLES_DIR)
  .filter(file => file.endsWith('.md'))
  .map(file => join(STYLES_DIR, file));

let migrated = 0;
let skipped = 0;

for (const filePath of files) {
  if (migrateStyleFile(filePath)) {
    console.log(`✅ Migrated: ${filePath}`);
    migrated++;
  } else {
    skipped++;
  }
}

console.log(`\n✨ Migration complete!`);
console.log(`   Migrated: ${migrated} files`);
console.log(`   Skipped: ${skipped} files`);
