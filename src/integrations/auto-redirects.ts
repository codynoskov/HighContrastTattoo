/**
 * Astro integration that auto-generates Cloudflare Pages _redirects
 * from the content collections at build time.
 *
 * For every artist and style, it computes all known slug variants
 * (file slug, date-stripped slug, slugified display name) and emits
 * a 301 redirect from each variant to the current display slug.
 *
 * Manual redirects can still be placed in public/_redirects;
 * they are preserved and the auto-generated block is appended.
 */
import type { AstroIntegration } from 'astro';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface ContentEntry {
  fileSlug: string;
  name: string;
  slugOverride?: string;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractField(frontmatter: string, field: string): string | undefined {
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^["']|["']$/g, '');
}

function parseContentFile(filePath: string): ContentEntry | null {
  const content = readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  const name = extractField(fm, 'name');
  if (!name) return null;

  return {
    fileSlug: filePath.split('/').pop()!.replace(/\.md$/, ''),
    name,
    slugOverride: extractField(fm, 'slugOverride'),
  };
}

function getDisplaySlug(entry: ContentEntry): string {
  return entry.slugOverride || entry.fileSlug;
}

function getKnownSlugs(entry: ContentEntry): Set<string> {
  const slugs = new Set<string>();

  slugs.add(entry.fileSlug);
  if (entry.slugOverride) slugs.add(entry.slugOverride);

  const dateStripped = entry.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  if (dateStripped !== entry.fileSlug) slugs.add(dateStripped);

  const nameSlug = slugifyName(entry.name);
  if (nameSlug) slugs.add(nameSlug);

  return slugs;
}

function readContentEntries(dirPath: string): ContentEntry[] {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseContentFile(join(dirPath, f)))
    .filter((e): e is ContentEntry => e !== null);
}

export default function autoRedirects(): AstroIntegration {
  let contentDir: string;

  return {
    name: 'auto-redirects',
    hooks: {
      'astro:config:done': ({ config }) => {
        contentDir = fileURLToPath(new URL('./src/content', config.root));
      },

      'astro:build:done': async ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const artists = readContentEntries(join(contentDir, 'artists'));
        const styles = readContentEntries(join(contentDir, 'styles'));

        const redirectLines: string[] = [];

        for (const artist of artists) {
          const displaySlug = getDisplaySlug(artist);
          for (const slug of getKnownSlugs(artist)) {
            if (slug !== displaySlug) {
              redirectLines.push(`/artists/${slug} /artists/${displaySlug} 301`);
            }
          }
        }

        for (const style of styles) {
          const displaySlug = getDisplaySlug(style);
          for (const slug of getKnownSlugs(style)) {
            if (slug !== displaySlug) {
              redirectLines.push(`/styles/${slug} /styles/${displaySlug} 301`);
            }
          }
        }

        if (redirectLines.length === 0) return;

        const outputPath = join(outDir, '_redirects');
        let existing = '';
        if (existsSync(outputPath)) {
          existing = readFileSync(outputPath, 'utf-8').trimEnd() + '\n';
        }

        const autoBlock = [
          '',
          '# Auto-generated slug redirects (do not edit — regenerated on every build)',
          ...redirectLines,
          '',
        ].join('\n');

        writeFileSync(outputPath, existing + autoBlock);
        console.log(`  ✓ Generated ${redirectLines.length} slug redirect(s) in _redirects`);
      },
    },
  };
}
