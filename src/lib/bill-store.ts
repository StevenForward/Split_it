"use client";

import { useSyncExternalStore } from "react";
import type { Assignments, Person, Receipt, SplitMode } from "./types";

export type BillState = {
  /**
   * NOTE: the receipt image is deliberately absent. It lives in component
   * state for the life of the scan.
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

export type BillSnapshot = {
  state: BillState;
  /**
   * False until the client store has taken over from the server snapshot —
   * route guards must wait for it before deciding to bounce to /upload.
   */
  hydrated: boolean;
};

/**
 * The bill lives in a module-level store rather than React state so it survives
 * client-side navigation between steps. It is deliberately NOT persisted: a full
 * page refresh reloads this module, resetting the bill to EMPTY, which sends the
 * route guards back to /upload with nothing carried over.
 */
const SERVER_SNAPSHOT: BillSnapshot = { state: EMPTY, hydrated: false };

let snapshot: BillSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function hydrate() {
  if (snapshot.hydrated) return;
  snapshot = { state: snapshot.state, hydrated: true };
}

function subscribe(listener: () => void) {
  // First subscriber flips the client store live; useSyncExternalStore re-reads
  // the snapshot right after subscribing, so `hydrated` lands immediately.
  hydrate();
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
  emit();
}

export function resetBill() {
  snapshot = { state: EMPTY, hydrated: true };
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

/** Set the restaurant name; an empty string clears it back to null. */
export function updateRestaurantName(name: string) {
  const receipt = snapshot.state.receipt;
  if (!receipt) return;
  updateBill({ receipt: { ...receipt, restaurantName: name.trim() || null } });
}

/** Set the receipt date from an ISO yyyy-mm-dd string; empty clears it. */
export function updateReceiptDate(isoDate: string) {
  const receipt = snapshot.state.receipt;
  if (!receipt) return;
  updateBill({ receipt: { ...receipt, date: isoDate || null } });
}

/** Append a fresh blank line item (manual entry / a missed row). */
export function addReceiptItem() {
  const receipt = snapshot.state.receipt;
  if (!receipt) return;
  updateBill({
    receipt: {
      ...receipt,
      items: [
        ...receipt.items,
        {
          id: `item-${crypto.randomUUID()}`,
          name: "",
          unitPriceCents: 0,
          quantity: 1,
        },
      ],
    },
  });
}

/**
 * Drop a line item along with any itemized assignments pointing at it. Refuses
 * to remove the last row so the receipt always has something to split.
 */
export function removeReceiptItem(itemId: string) {
  const { receipt, assignments } = snapshot.state;
  if (!receipt || receipt.items.length <= 1) return;
  const nextAssignments = { ...assignments };
  delete nextAssignments[itemId];
  updateBill({
    receipt: {
      ...receipt,
      items: receipt.items.filter((item) => item.id !== itemId),
    },
    assignments: nextAssignments,
  });
}
