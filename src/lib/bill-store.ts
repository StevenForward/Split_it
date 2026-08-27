"use client";

import { useSyncExternalStore } from "react";
import type { Assignments, Person, Receipt, SplitMode } from "./types";

export type BillState = {
  /**
   * NOTE: the receipt image is deliberately absent. It lives in component
   * state for the life of the scan and is never persisted — a base64 phone
   * photo is 4-10MB and blows the ~5MB sessionStorage quota, which used to
   * make persist() throw and silently drop the ENTIRE bill on refresh.
   */
  receipt: Receipt | null;
  people: Person[];
  splitMode: SplitMode | null;
  assignments: Assignments;
  /** Tip the user dials in on the results screen, in cents. */
  tipOverrideCents: number | null;
};

const EMPTY: BillState = {
  receipt: null,
  people: [],
  splitMode: null,
  assignments: {},
  tipOverrideCents: null,
};

const STORAGE_KEY = "split-it:bill";

export type BillSnapshot = {
  state: BillState;
  /** False until sessionStorage has been read — route guards must wait for it. */
  hydrated: boolean;
};

/**
 * The bill lives in a module-level store rather than React state so that
 * sessionStorage can be read once, outside of render, without a hydration
 * mismatch: the server always sees SERVER_SNAPSHOT.
 */
const SERVER_SNAPSHOT: BillSnapshot = { state: EMPTY, hydrated: false };

let snapshot: BillSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function loadFromStorage() {
  if (snapshot.hydrated) return;
  let restored = EMPTY;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) restored = { ...EMPTY, ...(JSON.parse(raw) as Partial<BillState>) };
  } catch {
    // Corrupt or unavailable storage just means we start fresh.
  }
  snapshot = { state: restored, hydrated: true };
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.state));
  } catch {
    // Quota or private-mode failures aren't worth breaking the flow over.
  }
}

function subscribe(listener: () => void) {
  // First subscriber triggers hydration; useSyncExternalStore re-reads the
  // snapshot right after subscribing, so the restored state lands immediately.
  loadFromStorage();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): BillSnapshot {
  return snapshot;
}

function getServerSnapshot(): BillSnapshot {
  return SERVER_SNAPSHOT;
}

export function updateBill(patch: Partial<BillState>) {
  snapshot = { state: { ...snapshot.state, ...patch }, hydrated: true };
  persist();
  emit();
}

export function resetBill() {
  snapshot = { state: EMPTY, hydrated: true };
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

export function useBill() {
  const { state, hydrated } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  // Module-level functions: already stable, no memoization needed.
  return { state, hydrated, update: updateBill, reset: resetBill };
}

/** Patch one line item in place, leaving the rest of the receipt untouched. */
export function updateReceiptItem(
  itemId: string,
  patch: Partial<{ name: string; unitPriceCents: number; quantity: number }>,
) {
  const receipt = snapshot.state.receipt;
  if (!receipt) return;
  updateBill({
    receipt: {
      ...receipt,
      items: receipt.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    },
  });
}
