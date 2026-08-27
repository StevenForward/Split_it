/** All money is stored as integer cents. Dollars only exist at the UI edges. */

export type LineItem = {
  /** Stable client-side id; assignments are keyed off this. */
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type Receipt = {
  restaurantName: string | null;
  /** ISO yyyy-mm-dd, or null if the model couldn't find one. */
  date: string | null;
  items: LineItem[];
  subtotalCents: number;
  taxCents: number;
  /** null = no tip line printed on the receipt. The user sets it on /results. */
  tipCents: number | null;
  totalCents: number;
};

export type Person = {
  id: string;
  name: string;
};

export type SplitMode = "equal" | "itemized";

/** itemId -> ids of the people sharing that item. */
export type Assignments = Record<string, string[]>;

export type PersonTotal = {
  personId: string;
  name: string;
  /** Their share of the pre-tax items. */
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
};
