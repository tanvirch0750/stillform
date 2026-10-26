'use client';

import { useEffect, useState } from 'react';
import type { RuntimeScript } from '../lib/reference';
import { isStorefrontHydrated } from '../lib/storefront-hydration';

declare global {
  interface Window {
    __dripcaseRuntime?: Promise<void>;
  }
}

function executeScript({ attributes, text }: RuntimeScript): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = false;
    for (const [name, value] of Object.entries(attributes)) {
      if (name !== 'async') script.setAttribute(name, value);
    }
    if (attributes.src && !attributes.src.startsWith('/runtime/') && attributes.src !== '/standalone.js') {
      reject(new Error('Refusing a non-local storefront script.'));
      return;
    }
    if (attributes.src || attributes.type === 'module') {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Could not load ${attributes.src || 'storefront script'}`));
    }
    script.textContent = text;
    document.head.append(script);
    if (!attributes.src && attributes.type !== 'module') resolve();
  });
}

function waitForStorefrontHydration(): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = performance.now() + 15_000;
    function check() {
      if (isStorefrontHydrated()) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (isStorefrontHydrated()) resolve(); else check();
        }));
      } else if (performance.now() > deadline) {
        reject(new Error('The storefront did not finish hydrating.'));
      } else requestAnimationFrame(check);
    }
    check();
  });
}

/** Boot the original animation app once, after Next has hydrated its own shell. */
export default function RuntimeBootstrap({ scripts }: { scripts: RuntimeScript[] }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    window.__dripcaseRuntime ??= (async () => {
      await executeScript({ attributes: { type: 'module', src: '/standalone.js' }, text: '' });
      for (const script of scripts) await executeScript(script);
      await waitForStorefrontHydration();
      document.documentElement.dataset.storefrontReady = 'true';
    })();
    let mounted = true;
    window.__dripcaseRuntime.catch((error: unknown) => {
      console.error('Storefront initialization failed:', error);
      if (mounted) setFailed(true);
    });
    return () => { mounted = false; };
  }, [scripts]);

  return failed ? <p role="alert">Interactive features could not start. Please reload the page.</p> : null;
}
