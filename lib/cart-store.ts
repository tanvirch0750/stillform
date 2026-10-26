'use client';

import { useSyncExternalStore } from 'react';
import { getProduct, itemKey, MAX_QUANTITY, sanitizeItems, SIZES, type BagItem, type Size } from './catalog';

export const BAG_STORAGE_KEY = 'dripcase:bag:v1';
const RECEIPT_KEY = 'dripcase:demo-receipt:v1';
type Panel = { kind: 'bag' } | { kind: 'quick' | 'guide'; productId: string } | null;
interface BagState { items: BagItem[]; code: string | null; ready: boolean; persistent: boolean; panel: Panel }
const initialState: BagState = { items: [], code: null, ready: false, persistent: true, panel: null };
let state = initialState;
const listeners = new Set<() => void>();
let initialized = false;

function publish(next: BagState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function commit(items: BagItem[], code = state.code) {
  let persistent = state.persistent;
  try { localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify({ version: 1, items, code })); }
  catch { persistent = false; }
  publish({ ...state, items, code, persistent });
}

function parseBag(raw: string | null) {
  try {
    const value = raw ? JSON.parse(raw) : {};
    return { items: sanitizeItems(value?.version === 1 ? value.items : []), code: value?.version === 1 && value?.code === 'WINTER50' ? 'WINTER50' : null };
  } catch { return { items: [] as BagItem[], code: null }; }
}

export function initializeBag() {
  if (initialized) return;
  initialized = true;
  let persistent = true;
  let bag = { items: [] as BagItem[], code: null as string | null };
  try { bag = parseBag(localStorage.getItem(BAG_STORAGE_KEY)); } catch { persistent = false; }
  publish({ ...state, ...bag, ready: true, persistent });
  window.addEventListener('storage', (event) => {
    if (event.key === BAG_STORAGE_KEY || event.key === null) publish({ ...state, ...parseBag(event.newValue) });
  });
}

export function useBag() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => state, () => initialState);
}

export function addItem(productId: string, size: Size) {
  if (!getProduct(productId) || !SIZES.includes(size)) return false;
  const existing = state.items.find((item) => itemKey(item) === itemKey({ productId, size }));
  if (existing && existing.quantity >= MAX_QUANTITY) return false;
  commit(existing ? state.items.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item) : [...state.items, { productId, size, quantity: 1 }]);
  return true;
}

export function setQuantity(key: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return;
  commit(state.items.map((item) => itemKey(item) === key ? { ...item, quantity } : item));
}
export const removeItem = (key: string) => commit(state.items.filter((item) => itemKey(item) !== key));
export function changeSize(key: string, size: Size) {
  if (SIZES.includes(size)) commit(sanitizeItems(state.items.map((item) => itemKey(item) === key ? { ...item, size } : item)));
}
export const applyCode = (code: string) => {
  if (code.trim().toUpperCase() !== 'WINTER50') return false;
  commit(state.items, 'WINTER50');
  return true;
};
export const removeCode = () => commit(state.items, null);
export const openBag = () => publish({ ...state, panel: { kind: 'bag' } });
export const openQuickAdd = (productId: string) => publish({ ...state, panel: { kind: 'quick', productId } });
export const openFitGuide = (productId: string) => publish({ ...state, panel: { kind: 'guide', productId } });
export const closePanel = () => { if (state.panel) publish({ ...state, panel: null }); };

export interface DemoReceipt {
  id: string;
  createdAt: string;
  items: BagItem[];
  code: string | null;
  delivery: 'standard' | 'express';
}
let lastReceipt: DemoReceipt | null = null;

/** Deliberately accepts NO customer, address, card, or payment information. */
export function createDemoReceipt(delivery: DemoReceipt['delivery']): DemoReceipt | null {
  if (!state.items.length) return null;
  lastReceipt = {
    id: `DEMO-${crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0').toUpperCase()}`,
    createdAt: new Date().toISOString(),
    items: state.items.map((item) => ({ ...item })),
    code: state.code,
    delivery,
  };
  try { sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(lastReceipt)); } catch { /* Receipt still works for this visit in memory. */ }
  commit([], null);
  return lastReceipt;
}

export function readDemoReceipt(): DemoReceipt | null {
  if (lastReceipt) return lastReceipt;
  try {
    const value = JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || 'null');
    if (!value || typeof value.id !== 'string' || !/^DEMO-[A-F0-9]{8}$/.test(value.id) || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))) return null;
    const items = sanitizeItems(value.items);
    if (!items.length || !['standard', 'express'].includes(value.delivery)) return null;
    return { id: value.id, createdAt: value.createdAt, items, code: value.code === 'WINTER50' ? 'WINTER50' : null, delivery: value.delivery };
  } catch { return null; }
}
