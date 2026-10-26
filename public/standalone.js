/** Local-only integrations. Published layout and animation remain untouched. */
let productsPromise;
let returnFocus;
let activeDialog;

function closeDialog() {
  if (!activeDialog) return;
  activeDialog.close();
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeDialog) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeDialog();
  }
}, true);

function createDialog(title) {
  if (activeDialog) activeDialog.close();
  returnFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'dc-dialog';
  dialog.setAttribute('aria-labelledby', 'dc-dialog-title');
  const header = document.createElement('div');
  header.className = 'dc-dialog-header';
  const heading = document.createElement('h2');
  heading.id = 'dc-dialog-title';
  heading.textContent = title;
  const close = document.createElement('button');
  close.className = 'dc-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close dialog');
  close.textContent = '×';
  close.addEventListener('click', closeDialog);
  header.append(heading, close);
  dialog.append(header);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (activeDialog === dialog) activeDialog = undefined;
    if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
  });
  document.body.append(dialog);
  activeDialog = dialog;
  return dialog;
}

function showNotice(title, paragraphs) {
  const dialog = createDialog(title);
  const body = document.createElement('div');
  body.className = 'dc-dialog-body';
  paragraphs.forEach((text, index) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    if (index) paragraph.className = 'dc-dialog-note';
    body.append(paragraph);
  });
  dialog.append(body);
  dialog.showModal();
}

async function openSearch() {
  const dialog = createDialog('SEARCH STILLFORM');
  const wrap = document.createElement('div');
  wrap.className = 'dc-search-wrap';
  const input = document.createElement('input');
  input.className = 'dc-search-input';
  input.type = 'search';
  input.placeholder = 'Search products…';
  input.setAttribute('aria-label', 'Search products');
  input.autocomplete = 'off';
  const results = document.createElement('div');
  results.className = 'dc-results';
  results.setAttribute('aria-live', 'polite');
  wrap.append(input);
  dialog.append(wrap, results);
  dialog.showModal();
  input.focus();
  productsPromise ??= fetch('/storefront-data.json').then((response) => {
    if (!response.ok) throw new Error('Unable to load products');
    return response.json();
  }).catch((error) => { productsPromise = undefined; throw error; });
  try {
    const products = await productsPromise;
    function render() {
      const query = input.value.trim().toLowerCase();
      const matches = products.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query));
      results.replaceChildren();
      if (!matches.length) {
        const empty = document.createElement('p');
        empty.className = 'dc-empty';
        empty.textContent = 'No products found. Try “hoodie”, “shirt”, or “crew”.';
        results.append(empty);
      }
      for (const product of matches) {
        const link = document.createElement('a');
        link.className = 'dc-result';
        link.href = product.route;
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = '';
        image.loading = 'lazy';
        const name = document.createElement('span');
        name.textContent = product.name;
        link.append(image, name);
        results.append(link);
      }
    }
    input.addEventListener('input', render);
    render();
  } catch {
    results.textContent = 'Search is temporarily unavailable. Please browse the collections.';
  }
}

// Capture first: never send purchases or customer information to the reference owner.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const search = event.target.closest('button[aria-label="Search Icon"]');
  if (search) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void openSearch();
    return;
  }
  const link = event.target.closest('a[href]');
  if (link && (link.getAttribute('href') === '#checkout' || /^https:\/\/(?:buy\.)?polar\.sh\//i.test(link.href))) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (document.documentElement.dataset.commerceReady === 'true') {
      window.dispatchEvent(new CustomEvent('dripcase:buy-now'));
      return;
    }
    showNotice('CHECKOUT', [
      'This storefront is a local recreation. Live checkout has not been connected, and no payment will be taken.',
      'Connect your own checkout provider before accepting orders. The reference owner’s payment link is intentionally disabled.',
    ]);
  }
}, true);

document.addEventListener('submit', (event) => {
  if (!(event.target instanceof HTMLFormElement)) return;
  const email = event.target.querySelector('input[type="email"]');
  if (!email) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showNotice('NEWSLETTER', [
    'Newsletter delivery is not connected in this local recreation. Your email has not been submitted or stored.',
    'Connect your own email marketing service to enable subscriptions.',
  ]);
}, true);

// Give the original hamburger control an accessible name without changing its layout.
function labelControls() {
  for (const link of document.querySelectorAll('nav a, footer a')) {
    if (link.querySelector('svg') && new URL(link.href, location.href).pathname === '/') link.setAttribute('aria-label', 'Stillform home');
  }
  for (const menu of document.querySelectorAll('nav [data-framer-name="Menu"][tabindex="0"]')) {
    menu.setAttribute('role', 'button');
    menu.setAttribute('aria-label', 'Toggle navigation');
  }
}
labelControls();
const observer = new MutationObserver(labelControls);
observer.observe(document.documentElement, { childList: true, subtree: true });
