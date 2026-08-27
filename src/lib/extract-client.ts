"use client";

import type { ExtractedReceipt } from "./extraction";
import type { LineItem, Receipt } from "./types";

export type ExtractionFailure = { code: string; message: string };

export async function extractReceipt(
  file: File,
): Promise<{ ok: true; receipt: Receipt } | { ok: false; error: ExtractionFailure }> {
  const body = new FormData();
  body.append("image", file);

  let response: Response;
  try {
    response = await fetch("/api/extract-receipt", { method: "POST", body });
  } catch {
    return {
      ok: false,
      error: {
        code: "network",
        message: "Couldn't reach the server. Check your connection and try again.",
      },
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: { code: "bad_response", message: "The server sent back something unreadable." },
    };
  }

  if (!response.ok) {
    const error = (payload as { error?: ExtractionFailure }).error;
    return {
      ok: false,
      error: error ?? { code: "unknown", message: "Extraction failed. Try again." },
    };
  }

  const extracted = (payload as { receipt: ExtractedReceipt }).receipt;
  return { ok: true, receipt: toReceipt(extracted) };
}

/** Attach the client-side ids that item editing and assignment are keyed on. */
function toReceipt(extracted: ExtractedReceipt): Receipt {
  const items: LineItem[] = extracted.items.map((item) => ({
    id: newItemId(),
    name: item.name,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
  }));

  return {
    restaurantName: extracted.restaurantName,
    date: extracted.date,
    items,
    // Nulls mean "not printed / illegible". Zero is the safe stand-in: totals
    // are derived from items anyway, so a missing subtotal can't corrupt them.
    subtotalCents: extracted.subtotalCents ?? 0,
    taxCents: extracted.taxCents ?? 0,
    totalCents: extracted.totalCents ?? 0,
  };
}

export function newItemId(): string {
  return `item-${crypto.randomUUID()}`;
}

/** The starting point when someone skips extraction and types it in themselves. */
export function blankReceipt(): Receipt {
  return {
    restaurantName: null,
    date: null,
    items: [{ id: newItemId(), name: "", unitPriceCents: 0, quantity: 1 }],
    subtotalCents: 0,
    taxCents: 0,
    totalCents: 0,
  };
}
