import { Type, type Schema } from "@google/genai";

/** The exact shape we force out of the model. Money is integer cents. */
export type ExtractedReceipt = {
  restaurantName: string | null;
  /** Raw, exactly as printed — normalized client-side by formatReceiptDate. */
  date: string | null;
  items: ExtractedItem[];
  subtotalCents: number | null;
  taxCents: number | null;
  /** The printed tip / gratuity / service-charge line, or null if there is none. */
  tipCents: number | null;
  totalCents: number | null;
};

export type ExtractedItem = {
  name: string;
  quantity: number;
  /** Price for ONE unit, never the line total. */
  unitPriceCents: number;
};

export const RECEIPT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    restaurantName: { type: Type.STRING, nullable: true },
    date: { type: Type.STRING, nullable: true },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.INTEGER },
          unitPriceCents: { type: Type.INTEGER },
        },
        required: ["name", "quantity", "unitPriceCents"],
      },
    },
    subtotalCents: { type: Type.INTEGER, nullable: true },
    taxCents: { type: Type.INTEGER, nullable: true },
    tipCents: { type: Type.INTEGER, nullable: true },
    totalCents: { type: Type.INTEGER, nullable: true },
  },
  required: [
    "restaurantName",
    "date",
    "items",
    "subtotalCents",
    "taxCents",
    "tipCents",
    "totalCents",
  ],
};

export const EXTRACTION_PROMPT = `You are reading a photograph of a restaurant receipt. Extract its contents exactly as printed.

MONEY
- Every monetary value is an INTEGER NUMBER OF CENTS. $14.50 is 1450. $7 is 700.
- Never return a decimal or a currency symbol.

LINE ITEMS
- unitPriceCents is the price of ONE unit, never the line total. If a line reads "2 Sparkling Water 12.00", return quantity 2 and unitPriceCents 600.
- If no quantity is printed for a line, use 1 and treat the printed price as the unit price.
- Use the item name as printed, cleaned of leading item codes and trailing dot-leaders. Keep modifiers that appear on their own indented lines attached to the item above them only if they carry a price of their own; otherwise ignore them.
- Do NOT include these as items: subtotal, tax, tip, gratuity, service charge, total, balance due, payment/card lines, change, discounts, or loyalty lines.

TIP
- tipCents is the tip, gratuity, or automatic service-charge amount printed on the receipt. Report it only as the top-level tipCents field, never as a line item, and never fold it into any item.
- If more than one such line is printed (e.g. a gratuity and a separate service charge), return their sum.
- If a tip line is present but blank, written in by hand, or otherwise illegible, return null. If no tip line is printed at all, also return null. Do not treat null as zero and do not calculate it from the total.

DATE
- Return the date string exactly as printed, in whatever format appears on the paper. Do not reformat it. If a time is printed alongside it, return only the date portion.

WHEN YOU CANNOT READ SOMETHING
- Return null for any top-level field that is missing, smudged, cut off, or otherwise illegible. Do not guess, infer, or calculate it.
- Specifically: do not compute subtotalCents by adding up the items, and do not derive totalCents by adding tax to the subtotal. Report only what is actually printed.
- If the image is not a receipt at all, return null for every top-level field and an empty items array.

Accuracy matters more than completeness. A null is correct; an invented number is not.`;

/**
 * The schema constrains structure but not sanity — a model can still emit a
 * negative price or a fractional quantity. Anything unusable is coerced or
 * dropped here rather than allowed to reach the UI.
 */
export function validateExtraction(raw: unknown): ExtractedReceipt | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const items: ExtractedItem[] = Array.isArray(obj.items)
    ? obj.items.flatMap((entry): ExtractedItem[] => {
        if (typeof entry !== "object" || entry === null) return [];
        const item = entry as Record<string, unknown>;
        const name = typeof item.name === "string" ? item.name.trim() : "";
        const quantity = toInt(item.quantity);
        const unitPriceCents = toInt(item.unitPriceCents);
        if (!name || unitPriceCents === null || unitPriceCents < 0) return [];
        return [
          {
            name,
            quantity: quantity && quantity > 0 ? Math.min(quantity, 99) : 1,
            unitPriceCents,
          },
        ];
      })
    : [];

  return {
    restaurantName: toTrimmedString(obj.restaurantName),
    date: toTrimmedString(obj.date),
    items,
    subtotalCents: toNonNegativeInt(obj.subtotalCents),
    taxCents: toNonNegativeInt(obj.taxCents),
    tipCents: toNonNegativeInt(obj.tipCents),
    totalCents: toNonNegativeInt(obj.totalCents),
  };
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toNonNegativeInt(value: unknown): number | null {
  const n = toInt(value);
  return n === null || n < 0 ? null : n;
}
