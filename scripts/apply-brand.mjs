import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { brandContent, wordmarkSVG } from './brand.mjs';

const root = path.resolve(import.meta.dirname, '..');
async function brandFiles(directory, extension) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await brandFiles(filename, extension);
    else if (entry.name.endsWith(extension)) {
      const original = await readFile(filename, 'utf8');
      const branded = brandContent(original);
      if (original !== branded) await writeFile(filename, branded);
    }
  }
}
await brandFiles(path.join(root, 'site'), '.html');
await brandFiles(path.join(root, 'public/runtime'), '.mjs');
const catalog = path.join(root, 'public/storefront-data.json');
const original = await readFile(catalog, 'utf8');
const branded = brandContent(original);
if (branded !== original) await writeFile(catalog, branded);
await mkdir(path.join(root, 'public/brand'), { recursive: true });
await writeFile(path.join(root, 'public/brand/stillform-wordmark.svg'), wordmarkSVG + '\n');
console.log('Stillform branding applied; animation definitions, routes and saved bags preserved.');
