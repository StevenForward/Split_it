import type { Assignments, Person, PersonTotal, Receipt } from "./types";
import {
  allocateProportional,
  lineItemTotalCents,
  splitEvenly,
} from "./money";

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
 * charged, not a function of our corrected prices. Tip starts from whatever the
 * receipt printed (0 if nothing was printed) and is replaced wholesale by
 * tipOverrideCents once the user edits it on /summary.
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
  const tipCents = tipOverrideCents ?? receipt.tipCents;

  return {
    subtotalCents,
    taxCents,
    tipCents,
    totalCents: subtotalCents + taxCents + tipCents,
    subtotalDiffersFromReceipt: subtotalCents !== receipt.subtotalCents,
  };
}

/**
 * Per-person breakdown for the itemized split. Each line item's cost is divided
 * evenly among the people assigned to it (leftover pennies handed out
 * left-to-right by splitEvenly). Tax and tip are then spread across people in
 * proportion to the item subtotal each one racked up, so the per-person totals
 * always sum back to deriveTotals().totalCents.
 *
 * Items with nobody assigned contribute nothing — the /assign screen keeps
 * "See totals" disabled until every item has a name, so that only bites on a
 * deep link into half-finished state. Stale assignee ids (a person removed on
 * /people after assigning) are ignored.
 */
export function derivePersonTotals(
  receipt: Receipt,
  people: Person[],
  assignments: Assignments,
  tipOverrideCents: number | null = null,
): PersonTotal[] {
  const { taxCents, tipCents } = deriveTotals(receipt, tipOverrideCents);
  const indexById = new Map(people.map((person, i) => [person.id, i]));
  const subtotals = people.map(() => 0);

  for (const item of receipt.items) {
    const assignees = (assignments[item.id] ?? []).filter((id) =>
      indexById.has(id),
    );
    if (assignees.length === 0) continue;
    const shares = splitEvenly(
      lineItemTotalCents(item.unitPriceCents, item.quantity),
      assignees.length,
    );
    assignees.forEach((id, i) => {
      subtotals[indexById.get(id)!] += shares[i];
    });
  }

  const taxShares = allocateProportional(taxCents, subtotals);
  const tipShares = allocateProportional(tipCents, subtotals);

  return people.map((person, i) => ({
    personId: person.id,
    name: person.name,
    subtotalCents: subtotals[i],
    taxCents: taxShares[i],
    tipCents: tipShares[i],
    totalCents: subtotals[i] + taxShares[i] + tipShares[i],
  }));
}
