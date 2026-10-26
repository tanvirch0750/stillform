/**
 * Freeze the publicly published reference and its asset graph locally.
 * Keeping its authored React/Motion definitions avoids approximating the design.
 * No image generation, tracking scripts, checkout credentials, or form data.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const origin = 'https://dripcase.framer.website';
const cache = path.join(root, '.reference-cache');
const site = path.join(root, 'site');
const publicRoot = path.join(root, 'public');
await Promise.all([mkdir(cache, { recursive: true }), mkdir(site, { recursive: true }), mkdir(publicRoot, { recursive: true })]);
const assets = new Map();
const modules = new Map();
const pages = new Map();
const failures = [];
const digest = (value) => createHash('sha256').update(value).digest('hex').slice(0, 16);
const unescape = (value) => value.replaceAll('&amp;', '&');

async function download(url) {
  const file = path.join(cache, digest(url));
  try { return await readFile(file); } catch {}
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok && !(response.status === 404 && url === `${origin}/404`)) throw new Error(`${response.status}: ${url}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(file, buffer);
      return buffer;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

function assetURLs(text) {
  return [...text.matchAll(/https:\/\/(?:framerusercontent\.com\/(?:images|assets)\/|fonts\.gstatic\.com\/)[^\s"'`<>)}\\]+/g)].map((match) => unescape(match[0]));
}

function registerAsset(raw) {
  const url = new URL(unescape(raw));
  // Runtime helpers also contain URL prefixes; those are not downloadable files.
  if (!path.extname(url.pathname)) return raw;
  // One frozen high-resolution original per image, shared by all responsive variants.
  const key = url.origin + url.pathname;
  if (!assets.has(key)) {
    const ext = path.extname(url.pathname) || '.bin';
    const filename = path.basename(url.pathname).replace(/[^a-zA-Z0-9._-]/g, '_');
    assets.set(key, { url: key, local: `/assets/${filename || digest(key) + ext}` });
  }
  return assets.get(key).local;
}

function rewriteAssets(text) {
  return text.replace(/https:\/\/(?:framerusercontent\.com\/(?:images|assets)\/|fonts\.gstatic\.com\/)[^\s"'`<>)}\\]+/g, (raw) => registerAsset(raw));
}

const queue = ['/'];
const seen = new Set();
while (queue.length) {
  const route = queue.shift();
  if (seen.has(route)) continue;
  seen.add(route);
  console.log(`Page ${route}`);
  const html = (await download(origin + route)).toString();
  pages.set(route, html);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(unescape(match[1]), origin + route);
    if (url.origin === origin && !/\.[a-z0-9]+$/i.test(url.pathname) && !seen.has(url.pathname)) queue.push(url.pathname.replace(/\/$/, '') || '/');
  }
  for (const url of assetURLs(html)) registerAsset(url);
  for (const match of html.matchAll(/(?:src|href)="(https:\/\/framerusercontent\.com\/sites\/[^"?]+\.mjs)"/g)) modules.set(match[1], null);
}

// Follow the full static and lazy module graph, including every product record.
while ([...modules.values()].some((value) => value === null)) {
  const batch = [...modules].filter(([, value]) => value === null).slice(0, 8);
  await Promise.all(batch.map(async ([url]) => {
    const text = (await download(url)).toString();
    modules.set(url, text);
    for (const match of text.matchAll(/["'`]((?:\.\/|https:\/\/framerusercontent\.com\/sites\/)[^"'`\s]+\.mjs)["'`]/g)) {
      const dependency = new URL(match[1], url).href;
      if (!modules.has(dependency)) modules.set(dependency, null);
    }
    for (const asset of assetURLs(text)) registerAsset(asset);
  }));
  console.log(`Runtime ${[...modules.values()].filter(Boolean).length}/${modules.size}`);
}

await mkdir(path.join(publicRoot, 'runtime'), { recursive: true });
for (const [url, original] of modules) {
  let text = rewriteAssets(original);
  text = text.replace(/https:\/\/buy\.polar\.sh\/[^"'`\s<)]+/g, '#checkout');
  text = text.replace('siteCanonicalURL:`https://dripcase.framer.website`', 'siteCanonicalURL:window.location.origin');
  // Published editing is not part of this standalone storefront.
  text = text.replace(/EditorBar:t===void 0\?void 0:\(\(\)=>\{[\s\S]*?\}\)\(\),adaptLayoutToTextDirection/, 'EditorBar:void 0,adaptLayoutToTextDirection');
  text = text.replaceAll('https://framerusercontent.com/sites/7ped0jygauXAzaAkzhQQhA/', '/runtime/');
  text = text.replace(/\n?\/\/# sourceMappingURL=.*$/gm, '');
  await writeFile(path.join(publicRoot, 'runtime', path.basename(url)), text);
}

await mkdir(path.join(publicRoot, 'assets'), { recursive: true });
const downloads = [...assets.values()];
for (let start = 0; start < downloads.length; start += 8) {
  await Promise.all(downloads.slice(start, start + 8).map(async (asset) => {
    try {
      const bytes = await download(asset.url);
      await writeFile(path.join(publicRoot, asset.local), bytes);
      asset.bytes = bytes.length;
    } catch (error) {
      if (asset.url.endsWith('/pGiXYozQ3mE4cilNOItfe2L2fUA.svg')) {
        // The reference's newsletter loading icon is already a 404. Supply a
        // local fallback; subscriptions themselves remain intentionally disabled.
        const spinner = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="2" stroke-dasharray="42 15"/></svg>';
        await writeFile(path.join(publicRoot, asset.local), spinner);
        asset.bytes = Buffer.byteLength(spinner);
        asset.note = 'Local fallback for an asset missing from the published reference.';
      } else failures.push({ url: asset.url, error: String(error) });
    }
  }));
  console.log(`Assets ${Math.min(start + 8, downloads.length)}/${downloads.length}`);
}

for (const [route, original] of pages) {
  let html = rewriteAssets(original);
  html = html.replace(/https:\/\/buy\.polar\.sh\/[^"'`\s<)]+/g, '#checkout');
  html = html.replace(/<script\b[^>]*src="https:\/\/events\.framer\.com\/[^>]*><\/script>/g, '');
  html = html.replace(/<link[^>]+href="https:\/\/(?:events\.framer\.com|api\.framer\.com)[^>]*>/g, '');
  html = html.replaceAll('https://framerusercontent.com/sites/7ped0jygauXAzaAkzhQQhA/', '/runtime/');
  html = html.replace(/<link[^>]+rel="canonical"[^>]*>/g, '<meta name="robots" content="noindex,nofollow">');
  // Do not display the hosted website-builder promotion in the standalone build.
  html = html.replace('</head>', '<script>if(location.pathname.length>1&&location.pathname.endsWith("/"))history.replaceState(null,"",location.pathname.slice(0,-1)+location.search+location.hash)</script><link rel="stylesheet" href="/standalone.css"><script type="module" src="/standalone.js"></script></head>');
  const filename = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`;
  await mkdir(path.dirname(path.join(site, filename)), { recursive: true });
  await writeFile(path.join(site, filename), html);
}

const manifest = {
  reference: origin,
  capturedAt: new Date().toISOString(),
  routes: [...pages.keys()],
  modules: [...modules.keys()].map((url) => `/runtime/${path.basename(url)}`),
  assets: [...assets.values()],
  failures,
};
await writeFile(path.join(root, 'reference-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const collections = new Set(['all', 'latestdrip', 'overshirts', 'hoodies', 'sweatshirts']);
const products = [...pages].filter(([route]) => route.startsWith('/products/') && !collections.has(route.split('/').at(-1))).map(([route, html]) => {
  const heading = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1]?.replace(/<[^>]*>/g, '').trim();
  const image = html.match(/<img\b[^>]*src="([^"]+)"/)?.[1];
  return {
    route,
    name: heading || route.split('/').at(-1).replaceAll('-', ' ').toUpperCase(),
    image: image ? registerAsset(image) : null,
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '',
  };
});
await writeFile(path.join(publicRoot, 'storefront-data.json'), JSON.stringify(products, null, 2) + '\n');
console.log(`Complete: ${pages.size} routes, ${modules.size} modules, ${assets.size} assets, ${failures.length} failures.`);
if (failures.length) process.exitCode = 1;
