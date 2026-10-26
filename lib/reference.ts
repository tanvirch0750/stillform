import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import manifest from '../reference-manifest.json';

export interface RuntimeScript {
  attributes: Record<string, string>;
  text: string;
}

export interface ReferencePage {
  route: string;
  title: string;
  description: string;
  markup: string;
  scripts: RuntimeScript[];
}

export const referenceRoutes = manifest.routes;
const routes = new Set<string>(referenceRoutes);
if (manifest.failures.length) throw new Error('Resolve reference asset failures with npm run sync:reference before building.');

function decodeAttribute(value: string): string {
  return value.replace(/&(?:quot|amp|lt|gt|#39);/g, (entity) => ({
    '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&#39;': "'",
  })[entity] || entity);
}

/** Read only allowlisted snapshots, never a path derived directly from input. */
export const getReferencePage = cache(async (route: string): Promise<ReferencePage | null> => {
  if (!routes.has(route)) return null;
  const filename = path.join(process.cwd(), 'site', route === '/' ? 'index.html' : `${route.slice(1)}/index.html`);
  const html = await readFile(filename, 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  let body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  const scripts: RuntimeScript[] = [];

  function stripExecutableScripts(markup: string): string {
    return markup.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (tag, rawAttributes: string, text: string) => {
      const attributes: Record<string, string> = {};
      for (const match of rawAttributes.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        attributes[match[1]] = decodeAttribute(match[2] ?? match[3] ?? match[4] ?? '');
      }
      // Leave data consumed by the original animation/hydration runtime in place.
      if (attributes.type?.startsWith('framer/') || attributes.type === 'application/ld+json') return tag;
      // Never reinstate the hosted editing preload, even if localStorage opts in.
      if (text.includes('__framer_force_showing_editorbar_since')) return '';
      if (attributes.src === '/standalone.js') return '';
      scripts.push({ attributes, text });
      return '';
    });
  }

  stripExecutableScripts(head);
  body = stripExecutableScripts(body);
  // Preserve the original page-specific styles and their order. A display:contents
  // boundary lets Next own the document without reconciling the nested Framer root.
  const styles = [...head.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(([tag]) => tag).join('\n');
  return {
    route,
    title: decodeAttribute(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Stillform'),
    description: decodeAttribute(head.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || ''),
    markup: styles + body,
    scripts,
  };
});
