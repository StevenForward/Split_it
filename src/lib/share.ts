/**
 * Turns a finished bill into a plain-text summary and a `mailto:` link. No
 * network, no backend — the whole breakdown rides in the email body the user's
 * mail client opens with. Kept framework-free so it can be unit-tested.
 */

import type { BillState } from "./bill-store";
import type { Receipt } from "./types";
import { formatReceiptDate } from "./date";
import { formatCents, splitEvenly } from "./money";
import { deriveTotals, derivePersonTotals } from "./totals";

export function billBreakdownText(receipt: Receipt, state: BillState): string {
  const totals = deriveTotals(receipt, state.tipOverrideCents);
  const itemized = state.splitMode === "itemized";
  const people = state.people;

  const lines: string[] = [];

  const where = receipt.restaurantName ?? "The bill";
  const when = formatReceiptDate(receipt.date, "");
  lines.push(when ? `${where} — ${when}` : where);
  lines.push("");

  if (itemized) {
    const rows = derivePersonTotals(
      receipt,
      people,
      state.assignments,
      state.tipOverrideCents,
    );
    rows.forEach((person, i) => {
      lines.push(
        `${person.name || `Person ${i + 1}`}: ${formatCents(person.totalCents)}`,
      );
      lines.push(
        `  items ${formatCents(person.subtotalCents)} · tax ${formatCents(
          person.taxCents,
        )} · tip ${formatCents(person.tipCents)}`,
      );
    });
  } else {
    const shares = splitEvenly(totals.totalCents, people.length || 1);
    people.forEach((person, i) => {
      lines.push(
        `${person.name || `Person ${i + 1}`}: ${formatCents(shares[i] ?? 0)}`,
      );
    });
  }

  lines.push("");
  lines.push(`Subtotal: ${formatCents(totals.subtotalCents)}`);
  lines.push(`Tax: ${formatCents(totals.taxCents)}`);
  lines.push(`Tip: ${formatCents(totals.tipCents)}`);
  lines.push(`Total: ${formatCents(totals.totalCents)}`);
  lines.push("");
  lines.push(
    itemized
      ? "Split by item — tax and tip are shared in proportion to each person's items."
      : "Split evenly, tax and tip included.",
  );
  lines.push("");
  lines.push("Sent from Split-It");

  return lines.join("\n");
}

/** `mailto:` with the subject and body pre-filled; recipients are left blank. */
export function billEmailHref(receipt: Receipt, state: BillState): string {
  const subject = receipt.restaurantName
    ? `Bill split — ${receipt.restaurantName}`
    : "Our bill split";
  const body = billBreakdownText(receipt, state);
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
