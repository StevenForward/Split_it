/** Money helpers. Everything internal is integer cents so nothing rounds twice. */

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** For text inputs: "12.34", "$12.34", "12" -> cents. Returns null if unparseable. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** For prefilling a text input from state. */
export function centsToDollarString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Split `totalCents` across `weights` using the largest-remainder method, so the
 * parts always sum back to exactly `totalCents` — no cents silently vanish.
 * Zero total weight falls back to an even split.
 */
export function allocateProportional(
  totalCents: number,
  weights: number[],
): number[] {
  if (weights.length === 0) return [];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) return splitEvenly(totalCents, weights.length);

  const exact = weights.map((w) => (totalCents * w) / totalWeight);
  const floors = exact.map((v) => Math.floor(v));
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0);

  // Hand the leftover pennies to the largest fractional parts first.
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const out = [...floors];
  for (let k = 0; remainder > 0; k++, remainder--) {
    out[order[k % order.length].i] += 1;
  }
  return out;
}

/** Even split where the leftover pennies go to the first people in the list. */
export function splitEvenly(totalCents: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function lineItemTotalCents(unitPriceCents: number, quantity: number) {
  return unitPriceCents * quantity;
}
