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
  /**
   * The tip printed on the receipt, or 0 when none was printed. The user can
   * override this on the summary screen (see BillState.tipOverrideCents).
   */
  tipCents: number;
  /** As printed. Items are the source of truth once the user edits them. */
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
