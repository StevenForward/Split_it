import type { Receipt } from "./types";
import { lineItemTotalCents } from "./money";

export type BillTotals = {
  /** Summed from the (possibly edited) line items, never read off the receipt. */
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  /** True when edits have pulled the subtotal away from what was extracted. */
  subtotalDiffersFromReceipt: boolean;
};

/**
 * Single source of truth for every screen after Review. Once line items are
 * editable, the extracted subtotal and total are stale the moment someone
 * fixes a misread price — so both get recomputed from the items on every read.
 *
 * Tax is deliberately NOT rescaled: it's an amount the restaurant actually
 * charged, not a function of our corrected prices. Tip never comes from the
 * receipt — it's entered by the user on /split, after they've seen the total.
 */
export function deriveTotals(
  receipt: Receipt,
  tipOverrideCents: number | null = null,
): BillTotals {
  const subtotalCents = receipt.items.reduce(
    (sum, item) => sum + lineItemTotalCents(item.unitPriceCents, item.quantity),
    0,
  );
  const taxCents = receipt.taxCents;
  const tipCents = tipOverrideCents ?? 0;

  return {
    subtotalCents,
    taxCents,
    tipCents,
    totalCents: subtotalCents + taxCents + tipCents,
    subtotalDiffersFromReceipt: subtotalCents !== receipt.subtotalCents,
  };
}
